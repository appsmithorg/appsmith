package com.appsmith.server.services;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Import({GitExecutorImpl.class})
public class GitServiceImpl implements GitService {

    private final UserService userService;
    private final UserDataService userDataService;
    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;
    private final GitFileUtils fileUtils;
    private final ImportExportApplicationService importExportApplicationService;
    private final GitExecutor gitExecutor;
    private final EncryptionService encryptionService;

    private final static String DEFAULT_COMMIT_MESSAGE = "System generated commit";
    private final static String DEFAULT_BRANCH_NAME = "master";

    @Override
    public Mono<UserData> saveGitConfigData(GitConfig gitConfig) {
        if(gitConfig.getAuthorName() == null || gitConfig.getAuthorName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Name"));
        }
        if(gitConfig.getAuthorEmail() == null || gitConfig.getAuthorEmail().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Email"));
        }
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {

                            /*
                             *  The gitConfig will be null if the user has not created profiles.
                             *  If null then we need to create this field for the currentUser and save the profile data
                             *  Else, replace the existing config value with the latest information
                             *  This config is used as the default git metadata in application object
                             * */

                            userData.setGitGlobalConfigData(gitConfig);
                            return userDataService.updateForUser(user, userData);
                        }));
    }

    @Override
    public Mono<GitConfig> getGitConfigForUser() {
        return userDataService.getForCurrentUser()
                .map(userData -> {
                    if (userData.getGitGlobalConfigData() == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find git author configuration for logged-in user." +
                                " You can set up a git profile from the user profile section."
                        );
                    }
                    return userData.getGitGlobalConfigData();
                });
    }

    @Override
    public Mono<String> commitApplication(String applicationId) {
        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE);
        return commitApplication(commitDTO, applicationId);
    }

    @Override
    public Mono<String> commitApplication(GitCommitDTO commitDTO, String applicationId) {

        /*
        1. Check if application exists and user have sufficient permissions
        2. Check if branch name exists in git metadata
        3. Save application to the existing worktree (Directory for the specific branch)
        4. Commit application : git add, git commit (Also check if git init required)
         */
        String commitMessage = commitDTO.getCommitMessage();
        if (commitMessage == null || commitMessage.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "commit message"));
        }
        Mono<Application> applicationMono = applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)));

        Mono<UserData> currentUserMono = userDataService.getForCurrentUser()
                .filter(userData -> userData.getGitGlobalConfigData() != null)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git author configuration for logged-in user. You can set up a git profile from the user profile section."))
                ).cache();

        return Mono.zip(applicationMono, currentUserMono)
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    GitApplicationMetadata gitMetadata = application.getGitApplicationMetadata();
                    if (gitMetadata == null || StringUtils.isEmptyOrNull(gitMetadata.getBranchName())) {
                        // TODO : Please throw the error here instead of assigning a defaultBranch
                        // throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "please provide valid branch name");
                        GitApplicationMetadata gitData = new GitApplicationMetadata();
                        gitData.setBranchName("master");
                        application.setGitApplicationMetadata(gitData);
                    }
                    return Mono.zip(
                            importExportApplicationService.exportApplicationById(applicationId, SerialiseApplicationObjective.VERSION_CONTROL),
                            Mono.just(application)
                    );
                })
                .flatMap(tuple -> {
                    ApplicationJson applicationJson = tuple.getT1();
                    Application application = tuple.getT2();
                    String branchName = application.getGitApplicationMetadata().getBranchName();
                    return Mono.zip(
                            fileUtils.saveApplicationToGitRepo(application.getOrganizationId(), applicationId, applicationJson, branchName),
                            currentUserMono,
                            Mono.just(branchName)
                    );
                })
                .map(tuple -> {
                    Path branchRepoPath = tuple.getT1();
                    // TODO : We will be creating a separate map of username to git profiles if user want seperate profile
                    //  for different repos, this implementation need updates after we introduce that change
                    GitConfig userGitProfile = tuple.getT2().getGitGlobalConfigData();
                    String branchName = tuple.getT3();
                    // Handle the condition where we have branch name like the filesystem path e.g. feature/f1 etc
                    Path baseRepo = branchRepoPath.subpath(0, branchRepoPath.getNameCount() - Paths.get(branchName).getNameCount());
                    try {
                        return gitExecutor.commitApplication(baseRepo, commitMessage, userGitProfile.getAuthorName(), userGitProfile.getAuthorEmail());
                    } catch (IOException | GitAPIException e) {
                        if (e instanceof EmptyCommitException) {
                            throw new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED,
                                    "commit",
                                    "On branch " + branchName + " nothing to commit, working tree clean"
                            );
                        }
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", e.getMessage());
                    }
                });
    }

    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(String applicationId) {
        Mono<Application> applicationMono = applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)));

        return applicationMono
                .map(application -> {
                    if (application.getGitApplicationMetadata() == null
                            || StringUtils.isEmptyOrNull(application.getGitApplicationMetadata().getBranchName())) {

                        // TODO : Please throw the error here instead of assigning a defaultBranch
                    /*
                    throw new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION,
                        "branch name is not available. Please reconfigure the application to connect to git repo"
                    );
                     */
                        GitApplicationMetadata gitData = new GitApplicationMetadata();
                        gitData.setBranchName("master");
                        gitData.setDefaultApplicationId(applicationId);
                        application.setGitApplicationMetadata(gitData);
                    }
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    try {
                        return gitExecutor.getCommitHistory(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getBranchName());
                    } catch (IOException | GitAPIException e) {
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "log", e.getMessage());
                    }
                });
    }

    /*
     *  Connect the application from Appsmith to a git repo
     *  This is the prerequisite step needed to perform all the git operation for an application
     *  We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under application.
     *  Each application is equal to a repo in the git(and each branch creates a new application with default application as parent)
     *  @param GitConnectDTO
     *            applicationId - this is used to link the git repo to an application
     *            remoteUrl - used for the git push pull branch etc
     *  @return Application object with the updated data
     * */
    @Override
    public Mono<Application> connectApplicationToGit(GitConnectDTO gitConnectDTO) {
        /*
         *  Connecting the application for the first time
         *  The ssh keys is already present in application object from the generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        if(StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        return saveGitConfigData(gitConnectDTO.getGitConfig())
                .flatMap(userData -> applicationService.getById(gitConnectDTO.getApplicationId())
                        .flatMap(application -> {
                            GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                            if(Optional.ofNullable(gitApplicationMetadata).isEmpty()
                                    || Optional.ofNullable(gitApplicationMetadata.getGitAuth()).isEmpty()
                                    || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPrivateKey())
                                    || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPublicKey())) {
                                return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER,
                                        "SSH Key is empty. Please reach out to Appsmith support"));
                            } else {
                                String defaultBranch = "";
                                try {
                                    defaultBranch = gitExecutor.cloneApp(
                                            getRelativePath(gitConnectDTO.getOrganizationId(), gitConnectDTO.getApplicationId()).toString(),
                                            getRepoName(gitConnectDTO.getRemoteUrl()),
                                            gitConnectDTO.getRemoteUrl(),
                                            encryptionService.decryptString(gitApplicationMetadata.getGitAuth().getPrivateKey()),
                                            gitApplicationMetadata.getGitAuth().getPublicKey());
                                } catch (GitAPIException e) {
                                    if( e instanceof TransportException) {
                                        return Mono.error( new AppsmithException(
                                                AppsmithError.AUTHENTICATION_FAILURE,
                                                "SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key"
                                        ));
                                    }
                                    if(e instanceof InvalidRemoteException) {
                                        return Mono.error( new AppsmithException(
                                                AppsmithError.INVALID_PARAMETER,
                                                "remote url"
                                        ));
                                    } else {
                                        return Mono.error( new AppsmithException(
                                                AppsmithError.AUTHENTICATION_FAILURE,
                                                "SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key"
                                        ));
                                    }
                                }
                                if(defaultBranch.equals("failed")) {
                                    return Mono.error( new AppsmithException(
                                            AppsmithError.AUTHENTICATION_FAILURE,
                                            "SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key"
                                    ));
                                }

                                gitApplicationMetadata.setIsDefault(Boolean.TRUE);
                                gitApplicationMetadata.setBranchName(DEFAULT_BRANCH_NAME);
                                gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                Application application1 = new Application();
                                application1.setGitApplicationMetadata(gitApplicationMetadata);
                                return applicationService.update(gitConnectDTO.getApplicationId(), application1);
                            }
                        }));
    }

    private Path getRelativePath(String orgID, String defaultApplicationId) {
        return Paths.get(orgID,defaultApplicationId);
    }

    private String getRepoName(String remoteUrl) {
        return remoteUrl.split("/")[1].replace(".git","");
    }
}
