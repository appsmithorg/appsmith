package com.appsmith.server.services;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitBranchDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
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
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Import({GitExecutorImpl.class})
public class GitServiceImpl implements GitService {

    private final UserService userService;
    private final UserDataService userDataService;
    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final GitFileUtils fileUtils;
    private final ImportExportApplicationService importExportApplicationService;
    private final GitExecutor gitExecutor;

    private final static String DEFAULT_COMMIT_MESSAGE = "System generated commit";

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, boolean isDefault, String defaultApplicationId) {
        if(gitProfile.getAuthorName() == null || gitProfile.getAuthorName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Name"));
        }
        if(gitProfile.getAuthorEmail() == null || gitProfile.getAuthorEmail().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Email"));
        }
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            GitProfile userGitProfile = userData.getDefaultOrAppSpecificGitProfiles(defaultApplicationId);
                            /*
                             *  The gitProfiles will be null if the user has not created any git profile.
                             *  If null or if the request is to save the profile as default then we need to create this
                             *  field for the currentUser and save the profile data
                             *  Otherwise create a new entry or update existing entry
                             * */


                            if (gitProfile.equals(userGitProfile)) {
                                return Mono.just(userData);
                            } else if (userGitProfile == null || isDefault) {
                                // Assign the default config
                                userData.setDefaultGitProfile(gitProfile);
                            } else {
                                userData.getGitProfiles().put(defaultApplicationId, gitProfile);
                            }
                            return userDataService.updateForUser(user, userData);
                        })
                        .map(userData -> userData.getGitProfiles())
                );
    }

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile) {
        return updateOrCreateGitProfileForCurrentUser(gitProfile, Boolean.TRUE, null);
    }

    @Override
    public Mono<GitProfile> getGitProfileForUser() {
        return getGitProfileForUser(null);
    }

    @Override
    public Mono<GitProfile> getGitProfileForUser(String defaultApplicationId) {
        return userDataService.getForCurrentUser()
                .map(userData -> {
                    if (userData.getDefaultOrAppSpecificGitProfiles(defaultApplicationId) == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find git author configuration for logged-in user." +
                                " You can set up a git profile from the user profile section."
                        );
                    }
                    return userData.getDefaultOrAppSpecificGitProfiles(defaultApplicationId);
                });
    }

    @Override
    public Mono<String> commitApplication(String applicationId) {
        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE);
        return commitApplication(commitDTO, applicationId);
    }

    /**
     * This method will make a commit to local repo
     * @param commitDTO information required for making a commit
     * @param applicationId application branch on which the commit needs to be done
     * @return success message
     */
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

        Mono<UserData> currentUserMono = userDataService.getForCurrentUser()
                .filter(userData -> !CollectionUtils.isNullOrEmpty(userData.getGitProfiles()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git author configuration for logged-in user. You can set up a git profile from the user profile section."))
                );

        return publishOrGetApplication(applicationId, commitDTO.getDoPush())
                .flatMap(application -> {
                    GitApplicationMetadata gitMetadata = application.getGitApplicationMetadata();
                    if (gitMetadata == null) {
                        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find the git " +
                                "configuration, please configure the your application to use version control service");
                    }
                    String errorEntity = "";
                    if (StringUtils.isEmptyOrNull(gitMetadata.getBranchName())) {
                        errorEntity = "branch name";
                    } else if (StringUtils.isEmptyOrNull(gitMetadata.getDefaultApplicationId())) {
                        errorEntity = "default application";
                    } else if (StringUtils.isEmptyOrNull(gitMetadata.getRepoName())) {
                        errorEntity = "repository name";
                    }

                    if (!errorEntity.isEmpty()) {
                        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find " + errorEntity);
                    }
                    return Mono.zip(
                            importExportApplicationService.exportApplicationById(applicationId, SerialiseApplicationObjective.VERSION_CONTROL),
                            Mono.just(application)
                    );
                })
                .flatMap(tuple -> {
                    ApplicationJson applicationJson = tuple.getT1();
                    Application application = tuple.getT2();
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    // For default branch we are storing the application in root directory and for children apps we are
                    // going to create a worktrees which will create a separate sibling directories inside the root directory
                    Path baseRepoSuffix =
                            Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                    boolean isDefault = gitData.getDefaultApplicationId().equals(applicationId);
                    try {
                        return Mono.zip(
                                fileUtils.saveApplicationToLocalRepo(baseRepoSuffix, applicationJson, gitData.getBranchName(), isDefault),
                                currentUserMono,
                                Mono.just(application.getGitApplicationMetadata())
                        );
                    } catch (IOException e) {
                        log.error("Unable to open git directory, with error : ", e);
                        return Mono.error(new AppsmithException(AppsmithError.IO_ERROR, e.getMessage()));
                    }
                })
                .map(tuple -> {
                    Path branchRepoPath = tuple.getT1();
                    GitApplicationMetadata gitApplicationData = tuple.getT3();
                    GitProfile authorProfile =
                            tuple.getT2().getDefaultOrAppSpecificGitProfiles(gitApplicationData.getDefaultApplicationId());

                    if (authorProfile == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find git author configuration for logged-in user." +
                                " You can set up a git profile from the user profile section."
                        );
                    }
                    try {
                        return gitExecutor.commitApplication(
                                branchRepoPath, commitMessage, authorProfile.getAuthorName(), authorProfile.getAuthorEmail()
                        );
                    } catch (IOException | GitAPIException e) {
                        log.error("git commit exception : ", e);
                        if (e instanceof EmptyCommitException) {
                            final String emptyCommitError = "On current branch nothing to commit, working tree clean";
                            if (Boolean.TRUE.equals(commitDTO.getDoPush())) {
                                return emptyCommitError;
                            }
                            throw new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED,
                                    "commit",
                                    emptyCommitError
                            );
                        }
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", e.getMessage());
                    }
                })
                .flatMap(commitResult -> {
                    StringBuilder result = new StringBuilder("Commit Result : " + commitResult);
                    if (Boolean.TRUE.equals(commitDTO.getDoPush())) {
                        //push flow
                        result.append(". Push Result : ");
                        return pushApplication(applicationId, false)
                                .map(pushResult -> result.append(pushResult).toString());
                    }
                    return Mono.just(result.toString());
                });
    }

    /**
     * Method to get commit history for application branch
     * @param applicationId application for which the commit history is needed
     * @return list of commits
     */
    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(String applicationId) {

        return getApplicationById(applicationId)
                .map(application -> {
                    if (application.getGitApplicationMetadata() == null
                            || StringUtils.isEmptyOrNull(application.getGitApplicationMetadata().getBranchName())) {

                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "branch name is not available. Please reconfigure the application to connect to git repo"
                        );
                    }
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    try {
                        Path branchSuffix = Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                        return gitExecutor.getCommitHistory(branchSuffix);
                    } catch (IOException | GitAPIException e) {
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "log", e.getMessage());
                    }
                });
    }

    /**
     *  Connect the application from Appsmith to a git repo
     *  This is the prerequisite step needed to perform all the git operation for an application
     *  We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under application.
     *  Each application is equal to a repo in the git(and each branch creates a new application with default application as parent)
     *  @param gitConnectDTO
     *            applicationId - this is used to link the local git repo to an application
     *            remoteUrl - used for connecting to remote repo etc
     *  @return Application object with the updated data
     * */
    @Override
    public Mono<Application> connectApplicationToGit(String defaultApplicationId, GitConnectDTO gitConnectDTO) {
        /*
         *  Connecting the application for the first time
         *  The ssh keys is already present in application object from the generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        if(StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        return updateOrCreateGitProfileForCurrentUser(
                gitConnectDTO.getGitProfile(), gitConnectDTO.isDefaultProfile(), gitConnectDTO.getDefaultApplicationId())
                .then(
                        getApplicationById(defaultApplicationId)
                                .flatMap(application -> {
                                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                                    if (Optional.ofNullable(gitApplicationMetadata).isEmpty()
                                            || Optional.ofNullable(gitApplicationMetadata.getGitAuth()).isEmpty()
                                            || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPrivateKey())
                                            || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPublicKey())) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER,
                                                "SSH Key is empty. Please reach out to Appsmith support"));
                                    } else {
                                        String defaultBranch;
                                        String repoName = getRepoName(gitConnectDTO.getRemoteUrl());
                                        try {
                                            Path repoPath =
                                                    Paths.get(application.getOrganizationId(), defaultApplicationId, repoName);

                                            defaultBranch = gitExecutor.cloneApp(
                                                    repoPath,
                                                    gitConnectDTO.getRemoteUrl(),
                                                    gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                                    gitApplicationMetadata.getGitAuth().getPublicKey()
                                            );
                                        } catch (GitAPIException e) {
                                            if (e instanceof TransportException) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.AUTHENTICATION_FAILURE,
                                                        "SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key"
                                                ));
                                            }
                                            if (e instanceof InvalidRemoteException) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.INVALID_PARAMETER,
                                                        "remote url"
                                                ));
                                            }
                                            log.error("Error while cloning the remote repo, {}", e.getMessage());
                                            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                        } catch (IOException e) {
                                            log.error("Error while accessing the file system, {}", e.getMessage());
                                            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                        }

                                        gitApplicationMetadata.setDefaultApplicationId(application.getId());
                                        gitApplicationMetadata.setBranchName(defaultBranch);
                                        gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitApplicationMetadata.setRepoName(repoName);
                                        Application application1 = new Application();
                                        application1.setGitApplicationMetadata(gitApplicationMetadata);
                                        return applicationService.update(defaultApplicationId, application1);
                                    }
                                })
                );
    }

    /**
     * Special chars are transformed to "-" : https://github.com/desktop/desktop/issues/3090
     * Sample repo urls :
     * git@github.com:username/reponame.git
     * ssh://git@bitbucket.org/<workspace_ID>/<repo_name>.git
     * @param remoteUrl ssh url of repo
     * @return repo name extracted from repo url
     */
    private String getRepoName(String remoteUrl) {
        // Pattern to match all words in the text
        final Matcher matcher = Pattern.compile("([^/]*).git$").matcher(remoteUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Remote URL is incorrect! Can you " +
                "please provide as per standard format => git@github.com:username/reponame.git");
    }

    @Override
    public Mono<String> pushApplication(String applicationId) {
        return pushApplication(applicationId, true);
    }

    /**
     * Push flow for dehydrated apps
     * @param applicationId application which needs to be pushed to remote repo
     * @return Success message
     */
    private Mono<String> pushApplication(String applicationId, boolean doPublish) {

        return publishOrGetApplication(applicationId, doPublish)
                .map(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (gitData == null
                            || StringUtils.isEmptyOrNull(gitData.getBranchName())
                            || StringUtils.isEmptyOrNull(gitData.getDefaultApplicationId())
                            || StringUtils.isEmptyOrNull(gitData.getGitAuth().getPrivateKey())) {

                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Please reconfigure the application to connect to git repo"
                        );
                    }
                    try {
                        String branchRef = "";
                        if (!applicationId.equals(gitData.getDefaultApplicationId())) {
                            branchRef = gitData.getBranchName();
                        }
                        Path branchSuffix =
                                Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName(), branchRef);

                        GitAuth gitAuth = gitData.getGitAuth();
                        String privateKey = gitAuth.getPrivateKey();
                        return gitExecutor.pushApplication(branchSuffix, gitData.getRemoteUrl(), gitAuth.getPublicKey(), privateKey);
                    } catch (IOException | GitAPIException | URISyntaxException e) {
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", e.getMessage());
                    }
                });
    }

    @Override
    public Mono<String> updateRemote(String applicationId, String remoteUrl) {
        return getApplicationById(applicationId)
                .flatMap(application -> {
                    Application application1 = new Application();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    gitApplicationMetadata.setRemoteUrl(remoteUrl);
                    application1.setGitApplicationMetadata(gitApplicationMetadata);
                    return applicationService.update(applicationId, application1);
                })
                .thenReturn(remoteUrl);
    }

    public Mono<Application> createBranch(String srcApplicationId, GitBranchDTO branchDTO) {
        return getApplicationById(srcApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (gitData == null || gitData.getDefaultApplicationId() == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find root application. Please configure the application with git"
                        );
                    }
                    // create a worktree in local, also check if branch is already present
                    Path repoSuffix =
                            Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                    try {
                        String branchName = gitExecutor.createWorktree(repoSuffix, branchDTO.getBranchName());
                        gitData.setBranchName(branchName);
                        gitData.setGitAuth(null);
                        return applicationPageService.createApplication(application);
                    } catch (IOException | GitAPIException e) {
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "branch", e.getMessage());
                    }
                });
    }

    Mono<Application> publishOrGetApplication(String applicationId, boolean publish) {
        if (Boolean.TRUE.equals(publish)) {
            return applicationPageService.publish(applicationId, true);
        }
        return getApplicationById(applicationId);
    }

    Mono<Application> getApplicationById(String applicationId) {
        return applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)));
    }

    /**
     * We assume that the repo already exists via the connect or commit api
     * @param applicationId application for which we want to pull remote changes and merge
     * @param branchName remoteBranch from which the changes will be pulled and merged
     * @return return the status of pull operation
     */
    @Override
    public Mono<String> pullForApplication(String applicationId, String branchName) {
        return getApplicationById(applicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Path repoPath = Paths.get(application.getOrganizationId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());
                    //TODO handle the condition for the non default branch as the file path varies
                    try {
                        return Mono.just(gitExecutor.pullApp(
                                repoPath,
                                gitApplicationMetadata.getRemoteUrl(),
                                gitApplicationMetadata.getBranchName(),
                                gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                gitApplicationMetadata.getGitAuth().getPublicKey()));
                    } catch (IOException | GitAPIException e) {
                        if (e.getMessage().contains("Nothing to fetch.")) {
                            return Mono.just("Nothing to fetch from remote. All changes are upto date.");
                        } else {
                            throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", e.getMessage());
                        }
                    }
                });
    }
}
