package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitConnectionLimitDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.CheckoutConflictException;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.constants.CommentConstants.APPSMITH_BOT_USERNAME;
import static com.appsmith.server.constants.FieldName.DEFAULT;

@Slf4j
@RequiredArgsConstructor
@Import({GitExecutorImpl.class})
public class GitServiceCEImpl implements GitServiceCE {

    private final UserService userService;
    private final UserDataService userDataService;
    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final GitFileUtils fileUtils;
    private final ImportExportApplicationService importExportApplicationService;
    private final GitExecutor gitExecutor;
    private final ResponseUtils responseUtils;
    private final EmailConfig emailConfig;
    private final CommonConfig commonConfig;
    private final ConfigService configService;
    private final CloudServicesConfig cloudServicesConfig;

    private final static String DEFAULT_COMMIT_MESSAGE = "System generated commit, ";
    private final static String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    private final static String MERGE_CONFLICT_BRANCH_NAME = "_mergeConflict";
    private final static String CONFLICTED_SUCCESS_MESSAGE = "branch has been created from conflicted state. Please resolve merge conflicts in remote and pull again";

    private final static Map<String, GitConnectionLimitDTO> gitLimitCache = new HashMap<>();

    private enum DEFAULT_COMMIT_REASONS {
        CONFLICT_STATE("for conflicted state"),
        CONNECT_FLOW("initial commit"),
        BRANCH_CREATED("after creating a new branch: "),
        SYNC_WITH_REMOTE_AFTER_PULL("for syncing changes with remote after git pull"),
        SYNC_REMOTE_AFTER_MERGE("for syncing changes with local branch after git merge, branch: ");

        private final String reason;

        DEFAULT_COMMIT_REASONS(String reason) {
            this.reason = reason;
        }
        private String getReason() {
            return this.reason;
        }
    }


    @Override
    public Mono<Application> updateGitMetadata(String applicationId, GitApplicationMetadata gitApplicationMetadata) {

        if (Optional.ofNullable(gitApplicationMetadata).isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Git metadata values cannot be null"));
        }

        // For default application we expect a GitAuth to be a part of gitMetadata. We are using save method to leverage
        // @Encrypted annotation used for private SSH keys
        return applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .flatMap(application -> {
                    application.setGitApplicationMetadata(gitApplicationMetadata);
                    return applicationService.save(application);
                })
                .flatMap(applicationService::setTransientFields)
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Mono<GitApplicationMetadata> getGitApplicationMetadata(String defaultApplicationId) {
        return Mono.zip(getApplicationById(defaultApplicationId), userDataService.getForCurrentUser())
                .map(tuple -> {
                    Application application = tuple.getT1();
                    UserData userData = tuple.getT2();
                    Map<String, GitProfile> gitProfiles = new HashMap<>();
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (!CollectionUtils.isNullOrEmpty(userData.getGitProfiles())) {
                        gitProfiles.put(DEFAULT, userData.getGitProfileByKey(DEFAULT));
                        gitProfiles.put(defaultApplicationId, userData.getGitProfileByKey(defaultApplicationId));
                    }
                    if (gitData == null) {
                        GitApplicationMetadata res = new GitApplicationMetadata();
                        res.setGitProfiles(gitProfiles);
                        return res;
                    }
                    gitData.setGitProfiles(gitProfiles);
                    if (gitData.getGitAuth() != null) {
                        gitData.setPublicKey(gitData.getGitAuth().getPublicKey());
                    }
                    gitData.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                    return gitData;
                });
    }

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, String defaultApplicationId) {

        // Throw error in following situations:
        // 1. Updating or creating global git profile (defaultApplicationId = "default") and update is made with empty
        //    authorName or authorEmail
        // 2. Updating or creating repo specific profile and user want to use repo specific profile but provided empty
        //    values for authorName and email

        if((DEFAULT.equals(defaultApplicationId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorName())
        ) {
            return Mono.error( new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Name"));
        } else if((DEFAULT.equals(defaultApplicationId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())
        ) {
            return Mono.error( new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Email"));
        } else if (StringUtils.isEmptyOrNull(defaultApplicationId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        if (DEFAULT.equals(defaultApplicationId)) {
            gitProfile.setUseGlobalProfile(null);
        } else if (!Boolean.TRUE.equals(gitProfile.getUseGlobalProfile())) {
            gitProfile.setUseGlobalProfile(Boolean.FALSE);
        }

        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService.getForUser(user.getId())
                        .flatMap(userData -> {
                            // GitProfiles will be null if the user has not created any git profile.
                            GitProfile savedProfile = userData.getGitProfileByKey(defaultApplicationId);
                            GitProfile defaultGitProfile = userData.getGitProfileByKey(DEFAULT);

                            if (savedProfile == null || !savedProfile.equals(gitProfile) || defaultGitProfile == null) {
                                userData.setGitProfiles(userData.setGitProfileByKey(defaultApplicationId, gitProfile));

                                // Assign appsmith user profile as a fallback git profile
                                if (defaultGitProfile == null) {
                                    GitProfile userProfile = new GitProfile();
                                    String authorName = StringUtils.isEmptyOrNull(user.getName())
                                            ? user.getUsername().split("@")[0]
                                            : user.getName();
                                    userProfile.setAuthorEmail(user.getEmail());
                                    userProfile.setAuthorName(authorName);
                                    userProfile.setUseGlobalProfile(null);
                                    userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT, userProfile));
                                }

                                // Update userData here
                                UserData requiredUpdates = new UserData();
                                requiredUpdates.setGitProfiles(userData.getGitProfiles());
                                return userDataService.updateForUser(user, requiredUpdates)
                                        .map(UserData::getGitProfiles);
                            }
                            return Mono.just(userData.getGitProfiles());
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                                    // If profiles are empty use Appsmith's user profile as git default profile
                                    GitProfile profile = new GitProfile();
                                    String authorName = StringUtils.isEmptyOrNull(user.getName()) ? user.getUsername().split("@")[0] : user.getName();

                                    profile.setAuthorName(authorName);
                                    profile.setAuthorEmail(user.getEmail());

                                    UserData requiredUpdates = new UserData();
                                    requiredUpdates.setGitProfiles(Map.of(DEFAULT, gitProfile));
                                    return userDataService.updateForUser(user, requiredUpdates)
                                            .map(UserData::getGitProfiles);
                                })
                        )
                        .filter(profiles -> !CollectionUtils.isNullOrEmpty(profiles))
                );
    }

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile) {
        gitProfile.setUseGlobalProfile(null);
        return updateOrCreateGitProfileForCurrentUser(gitProfile, DEFAULT);
    }

    @Override
    public Mono<GitProfile> getDefaultGitProfileOrCreateIfEmpty() {
        // Get default git profile if the default is empty then use Appsmith profile as a fallback value
        return getGitProfileForUser(DEFAULT)
                .flatMap(gitProfile -> {
                    if (StringUtils.isEmptyOrNull(gitProfile.getAuthorName()) || StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())) {
                        return updateGitProfileWithAppsmithProfile(DEFAULT);
                    }
                    gitProfile.setUseGlobalProfile(null);
                    return Mono.just(gitProfile);
                });
    }

    @Override
    public Mono<GitProfile> getGitProfileForUser(String defaultApplicationId) {
        return userDataService.getForCurrentUser()
                .map(userData -> {
                    GitProfile gitProfile = userData.getGitProfileByKey(defaultApplicationId);
                    if (gitProfile != null && gitProfile.getUseGlobalProfile() == null) {
                        gitProfile.setUseGlobalProfile(true);
                    } else if (gitProfile == null) {
                        // If the profile is requested for repo specific using the applicationId
                        GitProfile gitProfile1 = new GitProfile();
                        gitProfile1.setAuthorName("");
                        gitProfile1.setAuthorEmail("");
                        gitProfile1.setUseGlobalProfile(true);
                        return gitProfile1;
                    }
                    return gitProfile;
                });
    }

    private Mono<GitProfile> updateGitProfileWithAppsmithProfile(String key) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(currentUser -> {
                    GitProfile gitProfile = new GitProfile();
                    String authorName = StringUtils.isEmptyOrNull(currentUser.getName())
                            ? currentUser.getUsername().split("@")[0]
                            : currentUser.getName();
                    gitProfile.setAuthorEmail(currentUser.getEmail());
                    gitProfile.setAuthorName(authorName);
                    gitProfile.setUseGlobalProfile(null);
                    return userDataService.getForUser(currentUser)
                            .flatMap(userData -> {
                                UserData updates = new UserData();
                                if (CollectionUtils.isNullOrEmpty(userData.getGitProfiles())) {
                                    updates.setGitProfiles(Map.of(key, gitProfile));
                                } else {
                                    userData.getGitProfiles().put(key, gitProfile);
                                    updates.setGitProfiles(userData.getGitProfiles());
                                }
                                return userDataService.updateForUser(currentUser, updates)
                                        .thenReturn(gitProfile);
                            });
                });
    }

    /**
     * This method will make a commit to local repo
     *
     * @param commitDTO            information required for making a commit
     * @param defaultApplicationId application branch on which the commit needs to be done
     * @return success message
     */
    @Override
    public Mono<String> commitApplication(GitCommitDTO commitDTO, String defaultApplicationId, String branchName) {

        /*
        1. Check if application exists and user have sufficient permissions
        2. Check if branch name exists in git metadata
        3. Save application to the existing local repo
        4. Commit application : git add, git commit (Also check if git init required)
         */

        String commitMessage = commitDTO.getCommitMessage();
        StringBuilder result = new StringBuilder();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.CONNECT_FLOW.getReason());
        }
        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        Mono<UserData> currentUserMono = userDataService.getForCurrentUser()
                .flatMap(userData -> {
                    if (CollectionUtils.isNullOrEmpty(userData.getGitProfiles()) || userData.getGitProfileByKey(DEFAULT) == null) {
                        return sessionUserService
                                .getCurrentUser()
                                .flatMap(user -> {
                                    GitProfile gitProfile = new GitProfile();
                                    gitProfile.setAuthorName(StringUtils.isEmptyOrNull(user.getName()) ? user.getUsername().split("@")[0] : user.getName());
                                    gitProfile.setAuthorEmail(user.getEmail());
                                    Map<String, GitProfile> updateProfiles = userData.getGitProfiles();
                                    if (CollectionUtils.isNullOrEmpty(updateProfiles)) {
                                        updateProfiles = Map.of(DEFAULT, gitProfile);
                                    } else {
                                        updateProfiles.put(DEFAULT, gitProfile);
                                    }

                                    UserData update = new UserData();
                                    update.setGitProfiles(updateProfiles);
                                    return userDataService.update(userData.getUserId(), update);
                                });
                    }
                    return Mono.just(userData);
                });

        return this.getApplicationById(defaultApplicationId)
                .flatMap(defaultApplication -> {
                    GitApplicationMetadata defaultGitMetadata = defaultApplication.getGitApplicationMetadata();
                    Boolean dbIsRepoPrivate = defaultGitMetadata.getIsRepoPrivate();
                    if (!Boolean.TRUE.equals(dbIsRepoPrivate)) {
                        try {
                            if (StringUtils.isEmptyOrNull(defaultGitMetadata.getBrowserSupportedRemoteUrl())) {
                                defaultGitMetadata.setBrowserSupportedRemoteUrl(
                                        GitUtils.convertSshUrlToHttpsCurlSupportedUrl(defaultGitMetadata.getRemoteUrl())
                                );
                            }
                            Boolean isRepoPrivateCurrentStatus = GitUtils.isRepoPrivate(defaultGitMetadata.getBrowserSupportedRemoteUrl());
                            if (!isRepoPrivateCurrentStatus.equals(dbIsRepoPrivate)) {
                                defaultGitMetadata.setIsRepoPrivate(isRepoPrivateCurrentStatus);
                                // check if the commit application will be allowed if the repo is made private
                                return applicationService.save(defaultApplication)
                                        //Check the limit for number of private repo
                                        .flatMap(application -> getPrivateRepoLimitForOrg(application.getOrganizationId(), false)
                                                .flatMap(limitCount -> {
                                                    //get git connected apps count from db
                                                    return applicationService.getGitConnectedApplicationCount(application.getOrganizationId())
                                                            .flatMap(count -> {
                                                                if (limitCount <= count) {
                                                                    return Mono.error(new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR));
                                                                }
                                                                return Mono.just(application);
                                                            });
                                                }));
                            }
                        } catch (IOException e) {
                            log.debug("Error while checking if the repo is private: ", e);
                        }
                    }
                    return Mono.just(defaultApplication);
                })
                .then(applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS))
                .flatMap(branchedApplication -> publishAndOrGetApplication(branchedApplication.getId(), commitDTO.getDoPush()))
                .flatMap(branchedApplication -> {
                    GitApplicationMetadata gitApplicationMetadata = branchedApplication.getGitApplicationMetadata();
                    if (gitApplicationMetadata == null) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find the git " +
                                "configuration, please configure the your application to use version control service"));
                    }
                    String errorEntity = "";
                    if (StringUtils.isEmptyOrNull(gitApplicationMetadata.getBranchName())) {
                        errorEntity = "branch name";
                    } else if (StringUtils.isEmptyOrNull(gitApplicationMetadata.getDefaultApplicationId())) {
                        errorEntity = "default application";
                    } else if (StringUtils.isEmptyOrNull(gitApplicationMetadata.getRepoName())) {
                        errorEntity = "repository name";
                    }

                    if (!errorEntity.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find " + errorEntity));
                    }
                    return Mono.zip(
                            importExportApplicationService
                                    .exportApplicationById(branchedApplication.getId(), SerialiseApplicationObjective.VERSION_CONTROL),
                            Mono.just(branchedApplication)
                    );
                })
                .flatMap(tuple -> {
                    ApplicationJson applicationJson = tuple.getT1();
                    Application childApplication = tuple.getT2();
                    GitApplicationMetadata gitData = childApplication.getGitApplicationMetadata();
                    Path baseRepoSuffix =
                            Paths.get(childApplication.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                    try {
                        return Mono.zip(
                                fileUtils.saveApplicationToLocalRepo(baseRepoSuffix, applicationJson, gitData.getBranchName()),
                                currentUserMono,
                                Mono.just(childApplication)
                        );
                    } catch (IOException | GitAPIException e) {
                        log.error("Unable to open git directory, with error : ", e);
                        if (e instanceof RepositoryNotFoundException) {
                            return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", e));
                        }
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Path baseRepoPath = tuple.getT1();
                    UserData currentUserData = tuple.getT2();
                    Application childApplication = tuple.getT3();
                    GitApplicationMetadata gitApplicationData = childApplication.getGitApplicationMetadata();

                    GitProfile authorProfile = currentUserData.getGitProfileByKey(gitApplicationData.getDefaultApplicationId());

                    if (authorProfile == null
                            || StringUtils.isEmptyOrNull(authorProfile.getAuthorName())
                            || Boolean.TRUE.equals(authorProfile.getUseGlobalProfile())) {

                        // Use default author profile as the fallback value
                        if (currentUserData.getGitProfileByKey(DEFAULT) != null) {
                            authorProfile = currentUserData.getGitProfileByKey(DEFAULT);
                        }
                    }

                    if (authorProfile == null || StringUtils.isEmptyOrNull(authorProfile.getAuthorName())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find git author configuration for logged-in user." +
                                " You can set up a git profile from the user profile section."
                        ));
                    }
                    result.append("Commit Result : ");
                    return Mono.zip(
                            gitExecutor.commitApplication(baseRepoPath, commitMessage, authorProfile.getAuthorName(), authorProfile.getAuthorEmail(), false)
                                    .onErrorResume(error -> {
                                        if (error instanceof EmptyCommitException) {
                                            return Mono.just(EMPTY_COMMIT_ERROR_MESSAGE);
                                        }
                                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage()));
                                    }),
                            Mono.just(childApplication)
                    );
                })
                .flatMap(tuple -> {
                    Application childApplication = tuple.getT2();
                    String commitStatus = tuple.getT1();
                    result.append(commitStatus);

                    if (Boolean.TRUE.equals(commitDTO.getDoPush())) {
                        // Push flow
                        result.append(".\nPush Result : ");
                        return pushApplication(childApplication.getId(), false)
                                .map(pushResult -> result.append(pushResult).toString());
                    }
                    return Mono.just(result.toString());
                });
    }

    /**
     * Method to get commit history for application branch
     *
     * @param defaultApplicationId application for which the commit history is needed
     * @return list of commits
     */
    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(String defaultApplicationId, String branchName) {

        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, READ_APPLICATIONS)
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (gitData == null || StringUtils.isEmptyOrNull(application.getGitApplicationMetadata().getBranchName())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "branch name is not available. Please reconfigure the application to connect to git repo"
                        ));
                    }
                    Path baseRepoSuffix = Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                    // Checkout to branch
                    return Mono.zip(
                            gitExecutor.checkoutToBranch(baseRepoSuffix, gitData.getBranchName())
                                    .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", e.getMessage()))),
                            Mono.just(baseRepoSuffix)
                    );
                })
                .flatMap(tuple -> {
                    Path baseRepoSuffix = tuple.getT2();
                    return gitExecutor.getCommitHistory(baseRepoSuffix)
                            .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "log", e.getMessage())));
                });
    }

    /**
     * Connect the application from Appsmith to a git repo
     * This is the prerequisite step needed to perform all the git operation for an application
     * We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under application.
     * Each application is equal to a repo in the git(and each branch creates a new application with default application as parent)
     *
     * @param gitConnectDTO applicationId - this is used to link the local git repo to an application
     *                      remoteUrl - used for connecting to remote repo etc
     * @return Application object with the updated data
     */
    @Override
    public Mono<Application> connectApplicationToGit(String defaultApplicationId, GitConnectDTO gitConnectDTO, String originHeader) {
        /*
         *  Connecting the application for the first time
         *  The ssh keys is already present in application object from the generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        if (StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        if (originHeader == null || originHeader.isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        Mono<UserData> currentUserMono = userDataService.getForCurrentUser()
                .filter(userData -> !CollectionUtils.isNullOrEmpty(userData.getGitProfiles()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git author configuration for logged-in user. You can set up a git profile from the user profile section."))
                );

        Mono<Map<String, GitProfile>> profileMono = updateOrCreateGitProfileForCurrentUser(gitConnectDTO.getGitProfile(), defaultApplicationId);

        return profileMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git author configuration for logged-in user. You can set up a git profile from the user profile section."))
                )
                .then(getApplicationById(defaultApplicationId))
                //Check the limit for number of private repo
                .flatMap(application -> {
                    // Check if the repo is public
                    try {
                        if(!GitUtils.isRepoPrivate(GitUtils.convertSshUrlToHttpsCurlSupportedUrl(gitConnectDTO.getRemoteUrl()))) {
                            return Mono.just(application);
                        }
                    } catch (IOException e) {
                        log.debug("Error while checking if the repo is private: ", e);
                    }
                    return getPrivateRepoLimitForOrg(application.getOrganizationId(), true)
                        .flatMap(limitCount -> {
                            // get git connected apps count from db
                            return applicationService.getGitConnectedApplicationCount(application.getOrganizationId())
                                    .flatMap(count -> {
                                        if (limitCount <= count) {
                                            return Mono.error(new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR));
                                        }
                                        return Mono.just(application);
                                    });
                        });
                })
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    } else {
                        String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
                        Path repoPath = Paths.get(application.getOrganizationId(), defaultApplicationId, repoName);
                        Mono<String> defaultBranchMono = gitExecutor.cloneApplication(
                                repoPath,
                                gitConnectDTO.getRemoteUrl(),
                                gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                gitApplicationMetadata.getGitAuth().getPublicKey()
                        ).onErrorResume(error -> {
                            if (error instanceof TransportException) {
                                return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                            }
                            if (error instanceof InvalidRemoteException) {
                                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "remote url"));
                            }
                            log.error("Error while cloning the remote repo, {}", error.getMessage());
                            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                        });
                        return Mono.zip(
                                Mono.just(application),
                                defaultBranchMono,
                                Mono.just(repoName),
                                Mono.just(repoPath)
                        );
                    }
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    String defaultBranch = tuple.getT2();
                    String repoName = tuple.getT3();
                    Path repoPath = tuple.getT4();
                    final String applicationId = application.getId();
                    final String orgId = application.getOrganizationId();
                    try {
                        return fileUtils.checkIfDirectoryIsEmpty(repoPath)
                                .flatMap(isEmpty -> {
                                    if (!isEmpty) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_REPO));
                                    } else {
                                        GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                                        gitApplicationMetadata.setDefaultApplicationId(applicationId);
                                        gitApplicationMetadata.setBranchName(defaultBranch);
                                        gitApplicationMetadata.setDefaultBranchName(defaultBranch);
                                        gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitApplicationMetadata.setRepoName(repoName);
                                        gitApplicationMetadata.setBrowserSupportedRemoteUrl(
                                                GitUtils.convertSshUrlToHttpsCurlSupportedUrl(gitConnectDTO.getRemoteUrl())
                                        );
                                        try {
                                            gitApplicationMetadata.setIsRepoPrivate(
                                                    GitUtils.isRepoPrivate(gitApplicationMetadata.getBrowserSupportedRemoteUrl())
                                            );
                                        } catch (IOException e) {
                                            gitApplicationMetadata.setIsRepoPrivate(true);
                                            log.debug("Error while checking if the repo is private: ", e);
                                        }

                                        // Set branchName for each application resource
                                        return importExportApplicationService.exportApplicationById(applicationId, SerialiseApplicationObjective.VERSION_CONTROL)
                                                .flatMap(applicationJson -> {
                                                    applicationJson.getExportedApplication().setGitApplicationMetadata(gitApplicationMetadata);
                                                    return importExportApplicationService
                                                            .importApplicationInOrganization(orgId, applicationJson, applicationId, defaultBranch);
                                                });
                                    }
                                });
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                })
                .flatMap(application -> {
                    String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
                    String defaultPageId = "";
                    if (!application.getPages().isEmpty()) {
                        defaultPageId = application.getPages()
                                .stream()
                                .filter(applicationPage -> applicationPage.getIsDefault().equals(Boolean.TRUE))
                                .collect(Collectors.toList())
                                .get(0)
                                .getId();
                    }
                    String viewModeUrl = Paths.get("/", Entity.APPLICATIONS, "/", application.getId(),
                            Entity.PAGES, defaultPageId).toString();
                    String editModeUrl = Paths.get(viewModeUrl, "edit").toString();
                    //Initialize the repo with readme file
                    try {
                        return Mono.zip(
                                fileUtils.initializeGitRepo(
                                        Paths.get(application.getOrganizationId(), defaultApplicationId, repoName, "README.md"),
                                        originHeader + viewModeUrl,
                                        originHeader + editModeUrl
                                ),
                                currentUserMono)
                                .flatMap(tuple -> {
                                    UserData userData = tuple.getT2();
                                    // Commit and push application to check if the SSH key has the write access
                                    GitProfile profile = userData.getGitProfileByKey(defaultApplicationId);
                                    if (profile == null
                                            || StringUtils.isEmptyOrNull(profile.getAuthorName())
                                            || Boolean.TRUE.equals(profile.getUseGlobalProfile())) {

                                        profile = userData.getGitProfileByKey(DEFAULT);
                                    }

                                    return gitExecutor.commitApplication(
                                            tuple.getT1(),
                                            DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.CONNECT_FLOW.getReason(),
                                            profile.getAuthorName(),
                                            profile.getAuthorEmail(),
                                            false
                                    );
                                })
                                .flatMap(ignore -> {
                                    Path baseRepoSuffix =
                                            Paths.get(application.getOrganizationId(), defaultApplicationId, repoName);

                                    GitAuth gitAuth = application.getGitApplicationMetadata().getGitAuth();
                                    return gitExecutor.pushApplication(
                                            baseRepoSuffix,
                                            application.getGitApplicationMetadata().getRemoteUrl(),
                                            gitAuth.getPublicKey(),
                                            gitAuth.getPrivateKey(),
                                            application.getGitApplicationMetadata().getBranchName()
                                    )
                                            .onErrorResume(error ->
                                                    // If the push fails remove all the cloned files from local repo
                                                    fileUtils.detachRemote(baseRepoSuffix)
                                                            .flatMap(isDeleted -> {
                                                                if (error instanceof TransportException) {
                                                                    return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                                                }
                                                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage()));
                                                            })
                                            );
                                })
                                .thenReturn(responseUtils.updateApplicationWithDefaultResources(application));
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                });
    }

    private Mono<Integer> getPrivateRepoLimitForOrg(String orgId, boolean isClearCache) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        return configService.getInstanceId().map(instanceId -> {
            if (commonConfig.isCloudHosting()) {
                return instanceId + "_" + orgId;
            } else {
                return instanceId;
            }
        }).flatMap(key -> {
            // check the cache for the repo limit
            if(Boolean.FALSE.equals(isClearCache) && gitLimitCache.containsKey(key)) {
                return Mono.just(gitLimitCache.get(key).getRepoLimit());
            }
            // Call the cloud service API
            return WebClient
                    .create(baseUrl + "/api/v1/git/limit/" + key)
                    .get()
                    .exchange()
                    .flatMap(response -> {
                        if (response.statusCode().is2xxSuccessful()) {
                            return response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Integer>>() {
                            });
                        } else {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.CLOUD_SERVICES_ERROR,
                                    "Unable to connect to cloud-services with error status {}", response.statusCode()));
                        }
                    })
                    .map(ResponseDTO::getData)
                    // cache the repo limit
                    .map(limit -> {
                        GitConnectionLimitDTO gitConnectionLimitDTO = new GitConnectionLimitDTO();
                        gitConnectionLimitDTO.setRepoLimit(limit);
                        gitConnectionLimitDTO.setExpiryTime(Instant.now().plusSeconds(24 * 60 * 60));
                        gitLimitCache.put(key, gitConnectionLimitDTO);
                        return limit;
                    })
                    .doOnError(error -> log.error("Error fetching config from cloud services", error));
        });
    }

    @Override
    public Mono<String> pushApplication(String defaultApplicationId, String branchName) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }
        return applicationService.findBranchedApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, "for " + defaultApplicationId
                )))
                .flatMap(applicationId -> pushApplication(applicationId, true));
    }

    /**
     * Push flow for dehydrated apps
     *
     * @param applicationId application which needs to be pushed to remote repo
     * @return Success message
     */
    private Mono<String> pushApplication(String applicationId, boolean doPublish) {

        return publishAndOrGetApplication(applicationId, doPublish)
                .flatMap(application -> {
                    if (applicationId.equals(application.getGitApplicationMetadata().getDefaultApplicationId())) {
                        return Mono.just(application);
                    }
                    return applicationService.findById(application.getGitApplicationMetadata().getDefaultApplicationId())
                            .map(defaultApp -> {
                                application.getGitApplicationMetadata().setGitAuth(defaultApp.getGitApplicationMetadata().getGitAuth());
                                return application;
                            });
                })
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();

                    if (gitData == null
                            || StringUtils.isEmptyOrNull(gitData.getBranchName())
                            || StringUtils.isEmptyOrNull(gitData.getDefaultApplicationId())
                            || StringUtils.isEmptyOrNull(gitData.getGitAuth().getPrivateKey())) {

                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Please reconfigure the application to connect to git repo"
                        ));
                    }
                    Path baseRepoSuffix =
                            Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    GitAuth gitAuth = gitData.getGitAuth();
                    return gitExecutor.checkoutToBranch(baseRepoSuffix, application.getGitApplicationMetadata().getBranchName())
                            .then(gitExecutor.pushApplication(
                                    baseRepoSuffix,
                                    gitData.getRemoteUrl(),
                                    gitAuth.getPublicKey(),
                                    gitAuth.getPrivateKey(),
                                    gitData.getBranchName()))
                            .onErrorResume(error -> {
                                if (error instanceof TransportException) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            "push",
                                            " Uh oh! you haven't provided the write permission to deploy keys. Appsmith needs write access to push to remote, please provide one to proceed"));
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage()));
                            });
                })
                .flatMap(pushResult -> {
                    if (pushResult.contains("REJECTED")) {
                        final String error = "Failed to push some refs to remote\n" +
                                "> To prevent you from losing history, non-fast-forward updates were rejected\n" +
                                "> Merge the remote changes (e.g. 'git pull') before pushing again.";
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " push", error));
                    }
                    return Mono.just(pushResult);
                });
    }

    /**
     * Disconnect from the git repo. This method will remove all the git metadata for the application
     *
     * @param defaultApplicationId
     * @return Application data
     */
    @Override
    public Mono<Application> detachRemote(String defaultApplicationId) {
        return getApplicationById(defaultApplicationId)
                .flatMap(defaultApplication -> {
                    if (Optional.ofNullable(defaultApplication.getGitApplicationMetadata()).isEmpty()
                            || isInvalidDefaultApplicationGitMetadata(defaultApplication.getGitApplicationMetadata())) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Please reconfigure the application to connect to git repo")
                        );
                    }
                    //Remove the git contents from file system
                    GitApplicationMetadata gitApplicationMetadata = defaultApplication.getGitApplicationMetadata();
                    String repoName = gitApplicationMetadata.getRepoName();
                    Path repoPath = Paths.get(defaultApplication.getOrganizationId(), gitApplicationMetadata.getDefaultApplicationId(), repoName);
                    String defaultApplicationBranchName = gitApplicationMetadata.getBranchName();
                    String remoteUrl = gitApplicationMetadata.getRemoteUrl();
                    String privateKey = gitApplicationMetadata.getGitAuth().getPrivateKey();
                    String publicKey = gitApplicationMetadata.getGitAuth().getPublicKey();
                    return Mono.zip(
                            gitExecutor.listBranches(repoPath,
                                    remoteUrl,
                                    privateKey,
                                    publicKey,
                                    false),
                            Mono.just(defaultApplication),
                            Mono.just(repoPath),
                            Mono.just(defaultApplicationBranchName));
                })
                .flatMap(tuple -> {
                    Application defaultApplication = tuple.getT2();
                    Path repoPath = tuple.getT3();
                    List<String> branch = tuple.getT1()
                            .stream()
                            .map(GitBranchDTO::getBranchName)
                            .filter(branchName -> !branchName.startsWith("origin"))
                            .collect(Collectors.toList());

                    //Remove the parent application branch name from the list
                    branch.remove(tuple.getT4());
                    defaultApplication.setGitApplicationMetadata(null);
                    return fileUtils.detachRemote(repoPath)
                            .flatMap(status -> Flux.fromIterable(branch)
                                    .flatMap(gitBranch ->
                                            applicationService
                                                    .findByBranchNameAndDefaultApplicationId(gitBranch, defaultApplicationId, MANAGE_APPLICATIONS)
                                                    .flatMap(applicationPageService::deleteApplicationByResource)
                                    )
                                    .then(applicationService.save(defaultApplication)));
                })
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    public Mono<Application> createBranch(String defaultApplicationId, GitBranchDTO branchDTO, String srcBranch) {

        /*
        1. Check if the src application is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the application from source application reference
         */

        if (StringUtils.isEmptyOrNull(srcBranch) || srcBranch.startsWith("origin/")) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        return applicationService.findByBranchNameAndDefaultApplicationId(srcBranch, defaultApplicationId, MANAGE_APPLICATIONS)
                .zipWhen(srcApplication -> {
                    GitApplicationMetadata gitData = srcApplication.getGitApplicationMetadata();
                    if (gitData.getDefaultApplicationId().equals(srcApplication.getId())) {
                        return Mono.just(srcApplication.getGitApplicationMetadata().getGitAuth());
                    }
                    return applicationService.getSshKey(gitData.getDefaultApplicationId());
                })
                .flatMap(tuple -> {
                    Application srcApplication = tuple.getT1();
                    GitAuth defaultGitAuth = tuple.getT2();
                    GitApplicationMetadata srcBranchGitData = srcApplication.getGitApplicationMetadata();
                    if (srcBranchGitData == null
                            || srcBranchGitData.getDefaultApplicationId() == null
                            || srcBranchGitData.getRepoName() == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Unable to find the parent branch. Please create a branch from other available branches"
                        ));
                    }
                    Path repoSuffix = Paths.get(srcApplication.getOrganizationId(), srcBranchGitData.getDefaultApplicationId(), srcBranchGitData.getRepoName());
                    // Create a new branch from the parent checked out branch
                    return gitExecutor.checkoutToBranch(repoSuffix, srcBranch)
                            .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", "Unable to find " + srcBranch)))
                            .zipWhen(isCheckedOut -> gitExecutor.fetchRemote(repoSuffix, defaultGitAuth.getPublicKey(), defaultGitAuth.getPrivateKey(), false)
                                    .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "fetch", error))))
                            .flatMap(ignore -> gitExecutor.listBranches(repoSuffix, srcBranchGitData.getRemoteUrl(), defaultGitAuth.getPrivateKey(), defaultGitAuth.getPublicKey(), false)
                                    .flatMap(branchList -> {
                                        boolean isDuplicateName = branchList.stream()
                                                // We are only supporting origin as the remote name so this is safe
                                                //  but needs to be altered if we starts supporting user defined remote names
                                                .anyMatch(branch -> branch.getBranchName().replaceFirst("origin/", "")
                                                        .equals(branchDTO.getBranchName()));

                                        if (isDuplicateName) {
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                                    "remotes/origin/" + branchDTO.getBranchName(),
                                                    FieldName.BRANCH_NAME
                                            ));
                                        }
                                        return gitExecutor.createAndCheckoutToBranch(repoSuffix, branchDTO.getBranchName());
                                    }))
                            .flatMap(branchName -> {
                                final String srcApplicationId = srcApplication.getId();
                                srcBranchGitData.setBranchName(branchName);
                                srcBranchGitData.setIsRepoPrivate(null);
                                // Save a new application in DB and update from the parent branch application
                                srcBranchGitData.setGitAuth(null);
                                srcApplication.setId(null);
                                srcApplication.setPages(null);
                                srcApplication.setPublishedPages(null);
                                srcApplication.setGitApplicationMetadata(srcBranchGitData);
                                return Mono.zip(
                                        applicationService.save(srcApplication),
                                        importExportApplicationService.exportApplicationById(srcApplicationId, SerialiseApplicationObjective.VERSION_CONTROL)
                                );
                            })
                            .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "branch", error.getMessage())));
                })
                .flatMap(tuple -> {
                    Application savedApplication = tuple.getT1();
                    return importExportApplicationService.importApplicationInOrganization(
                            savedApplication.getOrganizationId(),
                            tuple.getT2(),
                            savedApplication.getId(),
                            branchDTO.getBranchName()
                    )
                            .flatMap(application -> {
                                // Commit and push for new branch created this is to avoid issues when user tries to create a
                                // new branch from uncommitted branch
                                GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.BRANCH_CREATED.getReason() + gitData.getBranchName());
                                commitDTO.setDoPush(true);
                                return commitApplication(commitDTO, gitData.getDefaultApplicationId(), gitData.getBranchName())
                                        .thenReturn(application);
                            });
                })
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    public Mono<Application> checkoutBranch(String defaultApplicationId, String branchName) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        //If the user is trying to check out remote branch, create a new branch if the branch does not exist already
        if (branchName.startsWith("origin/")) {
            String finalBranchName = branchName.replaceFirst("origin/", "");
            return applicationService.findByBranchNameAndDefaultApplicationId(finalBranchName, defaultApplicationId, READ_APPLICATIONS)
                    .onErrorResume(error -> checkoutRemoteBranch(defaultApplicationId, finalBranchName))
                    .map(application -> {
                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", branchName + " already exists");
                    });
        }

        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    return applicationService.findByBranchNameAndDefaultApplicationId(
                            branchName, defaultApplicationId, READ_APPLICATIONS
                    );
                })
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    private Mono<Application> checkoutRemoteBranch(String defaultApplicationId, String branchName) {
        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    String repoName = gitApplicationMetadata.getRepoName();
                    Path repoPath = Paths.get(application.getOrganizationId(), defaultApplicationId, repoName);

                    return gitExecutor.fetchRemote(repoPath, gitApplicationMetadata.getGitAuth().getPublicKey(), gitApplicationMetadata.getGitAuth().getPrivateKey(), false)
                            .flatMap(fetchStatus -> gitExecutor.checkoutRemoteBranch(repoPath, branchName).zipWith(Mono.just(application))
                                    .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " --checkout branch", error.getMessage()))));
                })
                .flatMap(tuple -> {
                    /*
                     * create a new application(each application => git branch)
                     * Populate the application from the file system
                     * Check if the existing branch track the given remote branch using the StoredConfig
                     * Use the create branch method with isRemoteFlag or use the setStartPoint ,method in createBranch method
                     * */
                    Application srcApplication = tuple.getT2();

                    //Create a new Application
                    GitApplicationMetadata srcBranchGitData = srcApplication.getGitApplicationMetadata();
                    final String srcApplicationId = srcApplication.getId();
                    srcBranchGitData.setBranchName(branchName);
                    srcBranchGitData.setDefaultApplicationId(defaultApplicationId);
                    // Save a new application in DB and update from the parent branch application
                    srcBranchGitData.setGitAuth(null);
                    srcBranchGitData.setIsRepoPrivate(null);
                    srcApplication.setId(null);
                    srcApplication.setPages(null);
                    srcApplication.setPublishedPages(null);
                    srcApplication.setGitApplicationMetadata(srcBranchGitData);

                    return applicationService.save(srcApplication)
                            .flatMap(application1 -> {
                                try {
                                    return fileUtils.reconstructApplicationFromGitRepo(srcApplication.getOrganizationId(), application1.getId(), srcApplication.getGitApplicationMetadata().getRepoName(), branchName)
                                            .zipWith(Mono.just(application1));
                                } catch (GitAPIException | IOException e) {
                                    log.error("Error while constructing the application from the git repo ", e);
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " checkout -t origin/" + branchName, e.getMessage()));
                                }
                            });
                })
                .flatMap(tuple -> {
                    // Get the latest application mono with all the changes
                    ApplicationJson applicationJson = tuple.getT1();
                    Application application = tuple.getT2();
                    return importExportApplicationService
                            .importApplicationInOrganization(application.getOrganizationId(), applicationJson, application.getId(), branchName);
                });
    }

    private Mono<Application> publishAndOrGetApplication(String applicationId, boolean publish) {
        if (Boolean.TRUE.equals(publish)) {
            return applicationPageService.publish(applicationId, true)
                    // Get application here to decrypt the git private key if present
                    .then(getApplicationById(applicationId));
        }
        return getApplicationById(applicationId);
    }

    Mono<Application> getApplicationById(String applicationId) {
        return applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)));
    }

    /**
     * We assume that the repo already exists via the connect or commit api
     *
     * @param applicationId application for which we want to pull remote changes and merge
     * @param branchName    remoteBranch from which the changes will be pulled and merged
     * @return return the status of pull operation
     */
    @Override
    public Mono<GitPullDTO> pullApplication(String applicationId, String branchName) {
        /*
         * 1.Dehydrate the application from Mongodb so that the file system has latest application data
         * 2.Do git pull after the rehydration and merge the remote changes to the current branch
         *   On Merge conflict - create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to mongodb so that the latest changes from remote are rendered to the application
         * 4.Get the latest application mono from the mongodb and send it back to client
         * */

        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, MANAGE_APPLICATIONS)
                .flatMap(branchedApplication -> {
                    // Check if the application is the default if not fetch the default application
                    GitApplicationMetadata gitData = branchedApplication.getGitApplicationMetadata();
                    if (gitData == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Unable to find git configuration! Please connect your application to git repo."
                        ));
                    }
                    if (StringUtils.equalsIgnoreCase(branchedApplication.getId(), gitData.getDefaultApplicationId())) {
                        return Mono.zip(Mono.just(branchedApplication), Mono.just(gitData));
                    }
                    return Mono.zip(
                            Mono.just(branchedApplication),
                            getApplicationById(gitData.getDefaultApplicationId())
                                    .map(Application::getGitApplicationMetadata)
                    );
                })
                .flatMap(tuple -> {
                    /*
                     * There are two cases. If the branchName is defaultBranch, defaultApplication will be used
                     * Else, get the Application object for the given branchName
                     * */
                    Application branchedApplication = tuple.getT1();
                    GitApplicationMetadata defaultGitMetadata = tuple.getT2();

                    Path repoSuffix = Paths.get(branchedApplication.getOrganizationId(),
                            defaultGitMetadata.getDefaultApplicationId(),
                            defaultGitMetadata.getRepoName());

                    return Mono.zip(
                            Mono.just(repoSuffix),
                            getStatus(defaultGitMetadata.getDefaultApplicationId(), branchName),
                            Mono.just(defaultGitMetadata.getGitAuth()),
                            Mono.just(branchedApplication)
                    );
                })
                .flatMap(tuple -> {
                    GitStatusDTO status = tuple.getT2();
                    // Check if the repo is clean
                    if (!CollectionUtils.isNullOrEmpty(status.getModified())) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.GIT_ACTION_FAILED,
                                        "pull",
                                        "There are uncommitted changes present in your local. Please commit them first and then try git pull"));
                    }

                    Path repoSuffix = tuple.getT1();
                    GitAuth gitAuth = tuple.getT3();
                    Application branchedApplication = tuple.getT4();
                    GitApplicationMetadata gitApplicationMetadata = branchedApplication.getGitApplicationMetadata();

                    // 2. git pull origin branchName
                    Mono<MergeStatusDTO> pullStatus = null;
                    try {
                        pullStatus = gitExecutor.pullApplication(
                                repoSuffix,
                                gitApplicationMetadata.getRemoteUrl(),
                                gitApplicationMetadata.getBranchName(),
                                gitAuth.getPrivateKey(),
                                gitAuth.getPublicKey())                                          .onErrorResume(error -> {
                                    if (error.getMessage().contains("Nothing to fetch")) {
                                        MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                        mergeStatus.setStatus("Nothing to fetch from remote. All changes are up to date.");
                                        mergeStatus.setMergeAble(true);
                                        return Mono.just(mergeStatus);
                                    }
                                    //else if(error.getMessage().contains("Merge conflict")) {
                                    // On merge conflict send the response with the error message
                                    //MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                    //mergeStatus.setStatus(error.getMessage());
                                    //mergeStatus.setMergeAble(false);
                                    //return Mono.just(mergeStatus);
                                    //}
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", error.getMessage()));
                                });
                    } catch (IOException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", e.getMessage()));
                    }

                    return Mono.zip(pullStatus, Mono.just(branchedApplication));
                })
                .flatMap(objects -> {
                    //3. Hydrate from file system to db
                    Application branchedApplication = objects.getT2();
                    MergeStatusDTO pullStatus = objects.getT1();
                    try {
                        Mono<ApplicationJson> applicationJson = fileUtils.reconstructApplicationFromGitRepo(
                                branchedApplication.getOrganizationId(),
                                branchedApplication.getGitApplicationMetadata().getDefaultApplicationId(),
                                branchedApplication.getGitApplicationMetadata().getRepoName(),
                                branchName);
                        return Mono.zip(Mono.just(pullStatus), Mono.just(branchedApplication), applicationJson);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " pull", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    MergeStatusDTO status = tuple.getT1();
                    Application branchedApplication = tuple.getT2();
                    ApplicationJson applicationJson = tuple.getT3();

                    //4. Get the latest application mono with all the changes
                    return importExportApplicationService
                            .importApplicationInOrganization(branchedApplication.getOrganizationId(), applicationJson, branchedApplication.getId(), branchName)
                            .flatMap(application1 -> {
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.SYNC_WITH_REMOTE_AFTER_PULL.getReason());
                                commitDTO.setDoPush(true);
                                // Make commit and push after pull is successful to have a clean repo
                                return this.commitApplication(commitDTO, application1.getGitApplicationMetadata().getDefaultApplicationId(), branchName)
                                        .thenReturn(getPullDTO(application1, status));
                            });
                });
    }

    private GitPullDTO getPullDTO(Application application, MergeStatusDTO status) {
        GitPullDTO gitPullDTO = new GitPullDTO();
        responseUtils.updateApplicationWithDefaultResources(application);
        gitPullDTO.setMergeStatus(status);
        gitPullDTO.setApplication(application);
        return gitPullDTO;
    }

    @Override
    public Mono<List<GitBranchDTO>> listBranchForApplication(String defaultApplicationId, Boolean pruneBranches) {
        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (gitApplicationMetadata == null || gitApplicationMetadata.getDefaultApplicationId() == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Unable to find default application. Please configure the application with git"));
                    }
                    Path repoPath = Paths.get(application.getOrganizationId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());

                    // Fetch default branch from DB if the ignoreCache is false else fetch from remote
                    Mono<List<GitBranchDTO>> gitBranchDTOMono = gitExecutor.listBranches(
                            repoPath,
                            gitApplicationMetadata.getRemoteUrl(),
                            gitApplicationMetadata.getGitAuth().getPrivateKey(),
                            gitApplicationMetadata.getGitAuth().getPublicKey(),
                            pruneBranches)
                            .onErrorResume(error -> Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED,
                                    "branch --list",
                                    "Error while accessing the file system. Details :" + error.getMessage()))
                            );
                    return Mono.zip(gitBranchDTOMono, Mono.just(application), Mono.just(repoPath));

                }).flatMap(tuple -> {
                    List<GitBranchDTO> gitBranchListDTOS = tuple.getT1();
                    Application application = tuple.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Path repoPath = tuple.getT3();
                    final String dbDefaultBranch = StringUtils.isEmptyOrNull(gitApplicationMetadata.getDefaultBranchName())
                            ? gitApplicationMetadata.getBranchName()
                            : gitApplicationMetadata.getDefaultBranchName();

                    if (Boolean.TRUE.equals(pruneBranches)) {
                        String defaultBranchRemote = gitBranchListDTOS
                                .stream()
                                .filter(GitBranchDTO::isDefault)
                                .map(GitBranchDTO::getBranchName)
                                .findFirst()
                                .orElse(dbDefaultBranch);

                        //update the default branch in db
                        gitApplicationMetadata.setDefaultBranchName(defaultBranchRemote);
                        application.setGitApplicationMetadata(gitApplicationMetadata);

                        // delete local branches which are not present in remote repo
                        List<String> remoteBranches = gitBranchListDTOS.stream()
                                .filter(gitBranchListDTO -> gitBranchListDTO.getBranchName().startsWith("origin"))
                                .map(gitBranchDTO -> gitBranchDTO.getBranchName().replaceFirst("origin/", ""))
                                .collect(Collectors.toList());

                        List<String> localBranch = gitBranchListDTOS.stream()
                                .filter(gitBranchListDTO -> !gitBranchListDTO.getBranchName().contains("origin"))
                                .map(gitBranchDTO -> gitBranchDTO.getBranchName())
                                .collect(Collectors.toList());

                        localBranch.removeAll(remoteBranches);

                        return Flux.fromIterable(localBranch)
                                .flatMap(gitBranch -> applicationService.findByBranchNameAndDefaultApplicationId(gitBranch, defaultApplicationId, MANAGE_APPLICATIONS)
                                        .flatMap(applicationPageService::deleteApplicationByResource)
                                        .flatMap(application1 -> gitExecutor.deleteBranch(repoPath, application1.getGitApplicationMetadata().getBranchName())))
                                .then(applicationService.save(application)
                                        .then(Mono.just(gitBranchListDTOS)));
                    } else {

                        gitBranchListDTOS
                                .stream()
                                .filter(branchDTO -> StringUtils.equalsIgnoreCase(branchDTO.getBranchName(), dbDefaultBranch))
                                .findFirst()
                                .ifPresent(branchDTO -> branchDTO.setDefault(true));
                        return Mono.just(gitBranchListDTOS);
                    }
                });
    }

    /**
     * Get the status of the mentioned branch
     *
     * @param defaultApplicationId root/default application
     * @param branchName           for which the status is required
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    public Mono<GitStatusDTO> getStatus(String defaultApplicationId, String branchName) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }
        final String finalBranchName = branchName.replaceFirst("origin/", "");
        /*
            1. Copy resources from DB to local repo
            2. Fetch the current status from local repo
         */


        return Mono.zip(
                getGitApplicationMetadata(defaultApplicationId),
                applicationService.findByBranchNameAndDefaultApplicationId(finalBranchName, defaultApplicationId, MANAGE_APPLICATIONS)
                        .onErrorResume(error -> {
                            //if the branch does not exist in local, checkout remote branch
                            return checkoutBranch(defaultApplicationId, finalBranchName);
                        })
                        .zipWhen(application -> importExportApplicationService.exportApplicationById(application.getId(), SerialiseApplicationObjective.VERSION_CONTROL)))
                .flatMap(tuple -> {
                    GitApplicationMetadata defaultApplicationMetadata = tuple.getT1();
                    Application application = tuple.getT2().getT1();
                    ApplicationJson applicationJson = tuple.getT2().getT2();
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    gitData.setGitAuth(defaultApplicationMetadata.getGitAuth());
                    Path repoSuffix =
                            Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    try {
                        return Mono.zip(
                                fileUtils.saveApplicationToLocalRepo(repoSuffix, applicationJson, finalBranchName),
                                Mono.just(gitData.getGitAuth())
                        );
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", e.getMessage()));
                    }
                })
                .flatMap(tuple -> gitExecutor.fetchRemote(tuple.getT1(), tuple.getT2().getPublicKey(), tuple.getT2().getPrivateKey(), true)
                        .then(gitExecutor.getStatus(tuple.getT1(), finalBranchName))
                        .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", error.getMessage()))));
    }

    @Override
    public Mono<GitPullDTO> mergeBranch(String defaultApplicationId, GitMergeDTO gitMergeDTO) {
        /*
         * 1.Dehydrate the application from Mongodb so that the file system has latest application data for both the source and destination branch application
         * 2.Do git checkout destinationBranch ---> git merge sourceBranch after the rehydration
         *   On Merge conflict - create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to mongodb so that the latest changes from remote are rendered to the application
         * 4.Get the latest application mono from the mongodb and send it back to client
         * */

        final String sourceBranch = gitMergeDTO.getSourceBranch();
        final String destinationBranch = gitMergeDTO.getDestinationBranch();

        if (StringUtils.isEmptyOrNull(sourceBranch) || StringUtils.isEmptyOrNull(destinationBranch)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        } else if (sourceBranch.startsWith("origin/")) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, sourceBranch));
        } else if (destinationBranch.startsWith("origin/")) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, destinationBranch));
        }

        return getApplicationById(defaultApplicationId)
                .flatMap(defaultApplication -> {
                    GitApplicationMetadata gitApplicationMetadata = defaultApplication.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(defaultApplication.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoSuffix = Paths.get(defaultApplication.getOrganizationId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());

                    //1. Hydrate from db to file system for both branch Applications
                    Mono<Path> pathToFile = this.getStatus(defaultApplicationId, sourceBranch)
                            .flatMap(status -> {
                                if (!Integer.valueOf(0).equals(status.getBehindCount())) {
                                    throw Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES, status.getBehindCount(), sourceBranch));
                                } else if (!CollectionUtils.isNullOrEmpty(status.getModified())) {
                                    throw Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES, sourceBranch));
                                }
                                return this.getStatus(defaultApplicationId, destinationBranch)
                                        .map(status1 -> {
                                            if (!Integer.valueOf(0).equals(status.getBehindCount())) {
                                                throw Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES, status.getBehindCount(), destinationBranch));
                                            } else if (!CollectionUtils.isNullOrEmpty(status.getModified())) {
                                                throw Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES, destinationBranch));
                                            }
                                            return status1;
                                        });
                            })
                            .thenReturn(repoSuffix);

                    return Mono.zip(
                            Mono.just(defaultApplication),
                            pathToFile
                    ).onErrorResume(error -> {
                        log.error("Error in repo status check application " + defaultApplicationId, error);
                        if (error instanceof AppsmithException) {
                            return Mono.error(error);
                        }
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", error));
                    });
                })
                .flatMap(tuple -> {
                    Application defaultApplication = tuple.getT1();
                    Path repoSuffix = tuple.getT2();

                    // 2. git checkout destinationBranch ---> git merge sourceBranch
                    return Mono.zip(
                            gitExecutor.mergeBranch(
                                    repoSuffix,
                                    sourceBranch,
                                    destinationBranch
                            ),
                            Mono.just(defaultApplication))
                            // On merge conflict create a new branch and push the branch to remote. Let the user resolve it the git client like github/gitlab handleMergeConflict
                            .onErrorResume(error -> {
                                if (error.getMessage().contains("Merge conflict")) {
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "Merge", error.getMessage()));
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "Merge", error.getMessage()));
                            });
                })
                .flatMap(mergeStatusTuple -> {
                    Application defaultApplication = mergeStatusTuple.getT2();
                    String mergeStatus = mergeStatusTuple.getT1();

                    //3. rehydrate from file system to db
                    try {
                        Mono<ApplicationJson> applicationJson = fileUtils.reconstructApplicationFromGitRepo(
                                defaultApplication.getOrganizationId(),
                                defaultApplication.getGitApplicationMetadata().getDefaultApplicationId(),
                                defaultApplication.getGitApplicationMetadata().getRepoName(),
                                destinationBranch);
                        return Mono.zip(
                                Mono.just(mergeStatus),
                                applicationService
                                        .findByBranchNameAndDefaultApplicationId(destinationBranch, defaultApplicationId, MANAGE_APPLICATIONS),
                                applicationJson
                        );
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "merge", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Application destApplication = tuple.getT2();
                    ApplicationJson applicationJson = tuple.getT3();
                    MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
                    mergeStatusDTO.setStatus(tuple.getT1());
                    mergeStatusDTO.setMergeAble(Boolean.TRUE);

                    //4. Get the latest application mono with all the changes
                    return importExportApplicationService
                            .importApplicationInOrganization(destApplication.getOrganizationId(), applicationJson, destApplication.getId(), destinationBranch.replaceFirst("origin/", ""))
                            .flatMap(application1 -> {
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setDoPush(true);
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.SYNC_REMOTE_AFTER_MERGE.getReason() + sourceBranch);
                                return this.commitApplication(commitDTO, defaultApplicationId, destinationBranch)
                                        .map(commitStatus -> {
                                            GitPullDTO gitPullDTO = new GitPullDTO();
                                            gitPullDTO.setMergeStatus(mergeStatusDTO);
                                            return gitPullDTO;
                                        });
                            });
                });
    }

    @Override
    public Mono<MergeStatusDTO> isBranchMergeable(String defaultApplicationId, GitMergeDTO gitMergeDTO) {

        final String sourceBranch = gitMergeDTO.getSourceBranch();
        final String destinationBranch = gitMergeDTO.getDestinationBranch();

        if (StringUtils.isEmptyOrNull(sourceBranch) || StringUtils.isEmptyOrNull(destinationBranch)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        } else if (sourceBranch.startsWith("origin/")) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, sourceBranch));
        } else if (destinationBranch.startsWith("origin/")) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, destinationBranch));
        }

        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoSuffix = Paths.get(application.getOrganizationId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());

                    //1. Hydrate from db to file system for both branch Applications
                    return this.getStatus(defaultApplicationId, sourceBranch)
                            .flatMap(srcBranchStatus -> {
                                if (!Integer.valueOf(0).equals(srcBranchStatus.getBehindCount())) {
                                    return Mono.error(Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES, srcBranchStatus.getBehindCount(), sourceBranch)));
                                } else if (!CollectionUtils.isNullOrEmpty(srcBranchStatus.getModified())) {
                                    return Mono.error(Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES, sourceBranch)));
                                }
                                return this.getStatus(defaultApplicationId, destinationBranch)
                                        .map(destBranchStatus -> {
                                            if (!Integer.valueOf(0).equals(destBranchStatus.getBehindCount())) {
                                                throw Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES, destBranchStatus.getBehindCount(), destinationBranch));
                                            } else if (!CollectionUtils.isNullOrEmpty(destBranchStatus.getModified())) {
                                                throw Exceptions.propagate(new AppsmithException(AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES, destinationBranch));
                                            }
                                            return destBranchStatus;
                                        });
                            })
                            .onErrorResume(error -> {
                                log.debug("Error in merge status check application " + defaultApplicationId, error);
                                if (error instanceof AppsmithException) {
                                    return Mono.error(error);
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", error));
                            })
                            .then(gitExecutor.isMergeBranch(repoSuffix, sourceBranch, destinationBranch))
                            .onErrorResume(error -> {
                                try {
                                    return gitExecutor.resetToLastCommit(repoSuffix, destinationBranch)
                                            .map(reset -> {
                                                MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                                mergeStatus.setMergeAble(false);
                                                mergeStatus.setStatus("Merge check failed!");
                                                mergeStatus.setMessage(error.getMessage());
                                                if (error instanceof CheckoutConflictException) {
                                                    mergeStatus.setConflictingFiles(((CheckoutConflictException) error)
                                                            .getConflictingPaths());
                                                }
                                                return mergeStatus;
                                            });
                                } catch (GitAPIException | IOException e) {
                                    log.error("Error while resetting to last commit", e);
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "reset --hard HEAD", e.getMessage()));
                                }
                            });
                });
    }

    @Override
    public Mono<String> createConflictedBranch(String defaultApplicationId, String branchName) {
        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        return Mono.zip(
                getGitApplicationMetadata(defaultApplicationId),
                applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                        .zipWhen(application -> importExportApplicationService.exportApplicationById(application.getId(), SerialiseApplicationObjective.VERSION_CONTROL)))
                .flatMap(tuple -> {
                    GitApplicationMetadata defaultApplicationMetadata = tuple.getT1();
                    Application application = tuple.getT2().getT1();
                    ApplicationJson applicationJson = tuple.getT2().getT2();
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    gitData.setGitAuth(defaultApplicationMetadata.getGitAuth());
                    Path repoSuffix =
                            Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    try {
                        return Mono.zip(
                                fileUtils.saveApplicationToLocalRepo(repoSuffix, applicationJson, branchName),
                                Mono.just(gitData),
                                Mono.just(repoSuffix)
                        );
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Path repoPath = tuple.getT1();
                    GitApplicationMetadata gitData = tuple.getT2();
                    Path repoSuffix = tuple.getT3();
                    return gitExecutor.createAndCheckoutToBranch(repoSuffix, branchName + MERGE_CONFLICT_BRANCH_NAME)
                            .flatMap(conflictedBranchName ->
                                    commitAndPushWithDefaultCommit(repoSuffix, gitData.getGitAuth(), gitData, DEFAULT_COMMIT_REASONS.CONFLICT_STATE)
                                            .flatMap(successMessage -> gitExecutor.checkoutToBranch(repoSuffix, branchName))
                                            .flatMap(isCheckedOut -> gitExecutor.deleteBranch(repoSuffix, conflictedBranchName))
                                            .flatMap(isCheckedOut -> gitExecutor.deleteBranch(repoSuffix, conflictedBranchName))
                                            .thenReturn(conflictedBranchName + CONFLICTED_SUCCESS_MESSAGE)
                            );
                });
    }

    private boolean isInvalidDefaultApplicationGitMetadata(GitApplicationMetadata gitApplicationMetadata) {
        return Optional.ofNullable(gitApplicationMetadata).isEmpty()
                || Optional.ofNullable(gitApplicationMetadata.getGitAuth()).isEmpty()
                || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPrivateKey())
                || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPublicKey());
    }

    private Mono<String> commitAndPushWithDefaultCommit(Path repoSuffix, GitAuth auth, GitApplicationMetadata gitApplicationMetadata, DEFAULT_COMMIT_REASONS reason) {
        return gitExecutor.commitApplication(repoSuffix, DEFAULT_COMMIT_MESSAGE + reason.getReason(), APPSMITH_BOT_USERNAME, emailConfig.getSupportEmailAddress(), true)
                .onErrorResume(error -> {
                    if (error instanceof EmptyCommitException) {
                        return Mono.just(EMPTY_COMMIT_ERROR_MESSAGE);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage()));
                })
                .flatMap(commitMessage ->
                        gitExecutor.pushApplication(
                                repoSuffix,
                                gitApplicationMetadata.getRemoteUrl(),
                                auth.getPublicKey(),
                                auth.getPrivateKey(),
                                gitApplicationMetadata.getBranchName())
                                .map(pushResult -> {
                                    if (pushResult.contains("REJECTED")) {
                                        final String error = "Failed to push some refs to remote\n" +
                                                "> To prevent you from losing history, non-fast-forward updates were rejected\n" +
                                                "> Merge the remote changes (e.g. 'git pull') before pushing again.";
                                        throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error);
                                    }
                                    return pushResult;
                                })
                );
    }

}
