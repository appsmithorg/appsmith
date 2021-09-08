package com.appsmith.server.services;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

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

    private final static String COMMIT_MESSAGE = "System generated commit";

    @Override
    public Mono<UserData> saveGitConfigData(GitConfig gitConfig) {
        if(gitConfig.getAuthorName() == null || gitConfig.getAuthorName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Name ", ""));
        }
        if(gitConfig.getAuthorEmail() == null || gitConfig.getAuthorEmail().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Email ", ""));
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
        return commitApplication(COMMIT_MESSAGE, applicationId);
    }

    @Override
    public Mono<String> commitApplication(String commitMessage, String applicationId) {

        /*
        1. Check if application exists and user have sufficient permissions
        2. Check if branch name exists in git metadata
        3. Save application to the existing worktree (Directory for the specific branch)
        4. Commit application : git add, git commit (Also check if git init required)
         */

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
                    throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", e.getMessage());
                }
            });
    }
}
