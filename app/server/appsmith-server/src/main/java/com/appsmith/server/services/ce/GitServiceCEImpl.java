package com.appsmith.server.services.ce;

import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.Datasource;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.CannotDeleteCurrentBranchException;
import org.eclipse.jgit.api.errors.CheckoutConflictException;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.constants.CommentConstants.APPSMITH_BOT_USERNAME;
import static com.appsmith.server.constants.FieldName.DEFAULT;
import static com.appsmith.server.helpers.DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

/**
 * Git APIs are slow today because these needs to communicate with remote repo and/or serialise and de-serialise the
 * application. This process takes time and the client may cancel the request. This leads to the flow getting stopped
 * midway producing corrupted states.
 * We use the synchronous sink to ensure that even though the client may have cancelled the flow, git operations should
 * proceed uninterrupted and whenever the user refreshes the page, we will have the sane state. synchronous sink does
 * not take subscription cancellations into account. This means that even if the subscriber has cancelled its
 * subscription, the create method still generates its event.
 *
 */

@Slf4j
@RequiredArgsConstructor
@Import({GitExecutorImpl.class})
public class GitServiceCEImpl implements GitServiceCE {

    private final UserService userService;
    private final UserDataService userDataService;
    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final GitFileUtils fileUtils;
    private final ImportExportApplicationService importExportApplicationService;
    private final GitExecutor gitExecutor;
    private final ResponseUtils responseUtils;
    private final EmailConfig emailConfig;
    private final AnalyticsService analyticsService;
    private final GitCloudServicesUtils gitCloudServicesUtils;
    private final GitDeployKeysRepository gitDeployKeysRepository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;

    private final static String DEFAULT_COMMIT_MESSAGE = "System generated commit, ";
    private final static String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    private final static String MERGE_CONFLICT_BRANCH_NAME = "_mergeConflict";
    private final static String CONFLICTED_SUCCESS_MESSAGE = "branch has been created from conflicted state. Please " +
            "resolve merge conflicts in remote and pull again";

    private final static String GIT_CONFIG_ERROR = "Unable to find the git configuration, please configure your application " +
            "with git to use version control service";

    private final static String GIT_PROFILE_ERROR = "Unable to find git author configuration for logged-in user. You can" +
            " set up a git profile from the user profile section.";

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
                .flatMap(applicationService::setTransientFields);
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
     * @param doAmend              if we want to amend the commit with the earlier one
     * @return success message
     */
    @Override
    public Mono<String> commitApplication(GitCommitDTO commitDTO, String defaultApplicationId, String branchName, boolean doAmend) {

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

        boolean isSystemGeneratedTemp = false;
        if(commitDTO.getCommitMessage().contains(DEFAULT_COMMIT_MESSAGE)) {
            isSystemGeneratedTemp = true;
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

        boolean isSystemGenerated = isSystemGeneratedTemp;
        Mono<String> commitMono = this.getApplicationById(defaultApplicationId)
                .flatMap(defaultApplication -> {
                    GitApplicationMetadata defaultGitMetadata = defaultApplication.getGitApplicationMetadata();
                    if (Optional.ofNullable(defaultGitMetadata).isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }
                    // Check if the repo is public for current application and if the user have changed the access after
                    // the connection
                    final Boolean isRepoPrivate = defaultGitMetadata.getIsRepoPrivate();
                    Mono<Application> applicationMono;
                    if (Boolean.FALSE.equals(isRepoPrivate)) {
                        applicationMono = GitUtils.isRepoPrivate(defaultGitMetadata.getBrowserSupportedRemoteUrl())
                                .flatMap(isPrivate -> {
                                    defaultGitMetadata.setIsRepoPrivate(isPrivate);
                                    if (!isPrivate.equals(defaultGitMetadata.getIsRepoPrivate())) {
                                       return applicationService.save(defaultApplication);
                                    } else {
                                        return Mono.just(defaultApplication);
                                    }
                                });
                    } else {
                        return Mono.just(defaultApplication);
                    }

                    // Check if the private repo count is less than the allowed repo count
                    final String workspaceId = defaultApplication.getWorkspaceId();
                    return applicationMono
                            .then(gitCloudServicesUtils.getPrivateRepoLimitForOrg(workspaceId, false))
                            .flatMap(limit -> {
                                if (limit == -1) {
                                    return Mono.just(defaultApplication);
                                }
                                return this.getApplicationCountWithPrivateRepo(workspaceId)
                                        .map(privateRepoCount -> {
                                            if (limit >= privateRepoCount) {
                                                return defaultApplication;
                                            }
                                            throw new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR);
                                        });
                            });
                })
                .then(applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS))
                .flatMap(branchedApplication -> {
                    GitApplicationMetadata gitApplicationMetadata = branchedApplication.getGitApplicationMetadata();
                    if (gitApplicationMetadata == null) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
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
                            Paths.get(childApplication.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    Mono<Path> repoPathMono;
                    try {
                        repoPathMono = fileUtils.saveApplicationToLocalRepo(baseRepoSuffix, applicationJson, gitData.getBranchName());
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(e);
                    }

                    gitData.setLastCommittedAt(Instant.now());
                    Mono<Application> branchedApplicationMono = updateGitMetadata(childApplication.getId(), gitData);
                    return Mono.zip(
                            repoPathMono,
                            currentUserMono,
                            branchedApplicationMono,
                            Mono.just(childApplication)
                    );
                })
                .onErrorResume(e -> {
                    log.error("Error in commit flow: ", e);
                    if (e instanceof RepositoryNotFoundException) {
                        return Mono.error(new AppsmithException(AppsmithError.REPOSITORY_NOT_FOUND, defaultApplicationId));
                    } else if (e instanceof AppsmithException) {
                        return Mono.error(e);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
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
                        String errorMessage = "Unable to find git author configuration for logged-in user. You can set " +
                                "up a git profile from the user profile section.";
                        return addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_COMMIT.getEventName(),
                                childApplication,
                                AppsmithError.INVALID_GIT_CONFIGURATION.getErrorType(),
                                AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(errorMessage),
                                childApplication.getGitApplicationMetadata().getIsRepoPrivate()
                        )
                        .flatMap(user -> Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, errorMessage))
                        );
                    }
                    result.append("Commit Result : ");
                    Mono<String> gitCommitMono = gitExecutor
                            .commitApplication(baseRepoPath, commitMessage, authorProfile.getAuthorName(), authorProfile.getAuthorEmail(), false, doAmend)
                            .onErrorResume(error -> {
                                if (error instanceof EmptyCommitException) {
                                    return Mono.just(EMPTY_COMMIT_ERROR_MESSAGE);
                                }
                                return addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_COMMIT.getEventName(),
                                        childApplication,
                                        error.getClass().getName(),
                                        error.getMessage(),
                                        childApplication.getGitApplicationMetadata().getIsRepoPrivate()
                                )
                                        .then(Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage())));
                            });

                    return Mono.zip(gitCommitMono, Mono.just(childApplication));
                })
                .flatMap(tuple -> {
                    Application childApplication = tuple.getT2();
                    String commitStatus = tuple.getT1();
                    result.append(commitStatus);

                    if (Boolean.TRUE.equals(commitDTO.getDoPush())) {
                        // Push flow
                        result.append(".\nPush Result : ");
                        return pushApplication(childApplication.getId(), false)
                                .map(pushResult -> result.append(pushResult).toString())
                                .zipWith(Mono.just(childApplication));
                    }
                    return Mono.zip(Mono.just(result.toString()), Mono.just(childApplication));
                })
                .flatMap(tuple -> {
                    Application childApplication = tuple.getT2();
                    String status = tuple.getT1();
                    return Mono.zip(Mono.just(status), publishAndOrGetApplication(childApplication.getId(), commitDTO.getDoPush()));
                })
                // Add BE analytics
                .flatMap(tuple -> {
                    String status = tuple.getT1();
                    Application childApplication = tuple.getT2();
                    // Update json schema versions so that we can detect if the next update was made by DB migration or
                    // by the user
                    Application update = new Application();
                    // Reset migration related fields before commit to detect the updates correctly between the commits
                    update.setClientSchemaVersion(JsonSchemaVersions.clientVersion);
                    update.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
                    update.setIsManualUpdate(false);
                    return applicationService.update(childApplication.getId(), update)
                            .then(addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_COMMIT.getEventName(),
                                    childApplication,
                                    "",
                                    "",
                                    childApplication.getGitApplicationMetadata().getIsRepoPrivate(),
                                    isSystemGenerated
                            ))
                            .thenReturn(status);
                });

        return Mono.create(sink -> commitMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<String> commitApplication(GitCommitDTO commitDTO, String defaultApplicationId, String branchName) {
        return this.commitApplication(commitDTO, defaultApplicationId, branchName, false);
    }

    /**
     * Method to get commit history for application branch
     *
     * @param defaultApplicationId application for which the commit history is needed
     * @return list of commits
     */
    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(String defaultApplicationId, String branchName) {

        Mono<List<GitLogDTO>> commitHistoryMono = applicationService
                .findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, READ_APPLICATIONS)
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (gitData == null || StringUtils.isEmptyOrNull(application.getGitApplicationMetadata().getBranchName())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                GIT_CONFIG_ERROR
                        ));
                    }
                    Path baseRepoSuffix = Paths.get(application.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
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

        return Mono.create(sink -> commitHistoryMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
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
         *  The ssh keys is already present in application object from generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        if (StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        if (StringUtils.isEmptyOrNull(originHeader)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        Mono<UserData> currentUserMono = userDataService.getForCurrentUser()
                .filter(userData -> !CollectionUtils.isNullOrEmpty(userData.getGitProfiles()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        Mono<Map<String, GitProfile>> profileMono = updateOrCreateGitProfileForCurrentUser(gitConnectDTO.getGitProfile(), defaultApplicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        final String browserSupportedUrl = GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl());

        Mono<Boolean> isPrivateRepoMono = GitUtils.isRepoPrivate(browserSupportedUrl).cache();


        Mono<Application> connectApplicationMono =  profileMono
                .then(getApplicationById(defaultApplicationId).zipWith(isPrivateRepoMono))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    boolean isRepoPrivate = tuple.getT2();
                    // Check if the repo is public
                    if(!isRepoPrivate) {
                        return Mono.just(application);
                    }
                    //Check the limit for number of private repo
                    return gitCloudServicesUtils.getPrivateRepoLimitForOrg(application.getWorkspaceId(), true)
                        .flatMap(limitCount -> {
                            // CS will respond with count -1 for unlimited git repos
                            if (limitCount == -1) {
                                return Mono.just(application);
                            }
                            // get git connected apps count from db
                            return this.getApplicationCountWithPrivateRepo(application.getWorkspaceId())
                                    .flatMap(count -> {
                                        if (limitCount <= count) {
                                            return addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_PRIVATE_REPO_LIMIT_EXCEEDED.getEventName(),
                                                    application,
                                                    AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                                    AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                                    application.getGitApplicationMetadata().getIsRepoPrivate()
                                            )
                                            .flatMap(ignore -> Mono.error(new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
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
                        Path repoSuffix = Paths.get(application.getWorkspaceId(), defaultApplicationId, repoName);
                        Mono<String> defaultBranchMono = gitExecutor.cloneApplication(
                                repoSuffix,
                                gitConnectDTO.getRemoteUrl(),
                                gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                gitApplicationMetadata.getGitAuth().getPublicKey()
                        )
                        .onErrorResume(error -> {
                            log.error("Error while cloning the remote repo, ", error);
                            return fileUtils.deleteLocalRepo(repoSuffix)
                                    .then(addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_CONNECT.getEventName(),
                                            application,
                                            error.getClass().getName(),
                                            error.getMessage(),
                                            application.getGitApplicationMetadata().getIsRepoPrivate()
                                    ))
                                    .flatMap(app -> {
                                        if (error instanceof TransportException) {
                                            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                        }
                                        if (error instanceof InvalidRemoteException) {
                                            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, error.getMessage()));
                                        }
                                        if (error instanceof TimeoutException) {
                                            return Mono.error(new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                        }
                                        if (error instanceof ClassCastException) {
                                    // To catch TransportHttp cast error in case HTTP URL is passed instead of SSH URL
                                    if(error.getMessage().contains("TransportHttp")) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_URL));
                                    }
                                }return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR, error.getMessage()));
                                    });
                        });
                        return Mono.zip(
                                Mono.just(application),
                                defaultBranchMono,
                                Mono.just(repoName),
                                Mono.just(repoSuffix)
                        );
                    }
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    String defaultBranch = tuple.getT2();
                    String repoName = tuple.getT3();
                    Path repoPath = tuple.getT4();
                    final String applicationId = application.getId();
                    final String workspaceId = application.getWorkspaceId();
                    try {
                        return fileUtils.checkIfDirectoryIsEmpty(repoPath).zipWith(isPrivateRepoMono)
                                .flatMap(objects -> {
                                    boolean isEmpty = objects.getT1();
                                    boolean isRepoPrivate = objects.getT2();
                                    if (!isEmpty) {
                                        return addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_CONNECT.getEventName(),
                                                application,
                                                AppsmithError.INVALID_GIT_REPO.getErrorType(),
                                                AppsmithError.INVALID_GIT_REPO.getMessage(),
                                                application.getGitApplicationMetadata().getIsRepoPrivate()
                                        )
                                        .then(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_REPO)));
                                    } else {
                                        GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                                        gitApplicationMetadata.setDefaultApplicationId(applicationId);
                                        gitApplicationMetadata.setBranchName(defaultBranch);
                                        gitApplicationMetadata.setDefaultBranchName(defaultBranch);
                                        gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitApplicationMetadata.setRepoName(repoName);
                                        gitApplicationMetadata.setBrowserSupportedRemoteUrl(browserSupportedUrl);

                                        gitApplicationMetadata.setIsRepoPrivate(isRepoPrivate);
                                        gitApplicationMetadata.setLastCommittedAt(Instant.now());

                                        // Set branchName for each application resource
                                        return importExportApplicationService.exportApplicationById(applicationId, SerialiseApplicationObjective.VERSION_CONTROL)
                                                .flatMap(applicationJson -> {
                                                    applicationJson.getExportedApplication().setGitApplicationMetadata(gitApplicationMetadata);
                                                    return importExportApplicationService
                                                            .importApplicationInWorkspace(workspaceId, applicationJson, applicationId, defaultBranch);
                                                });
                                    }
                                })
                                .onErrorResume(e -> {
                                    if (e instanceof IOException) {
                                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                                    }
                                    return Mono.error(e);
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
                                fileUtils.initializeReadme(
                                        Paths.get(application.getWorkspaceId(), defaultApplicationId, repoName, "README.md"),
                                        originHeader + viewModeUrl,
                                        originHeader + editModeUrl
                                        ).onErrorMap(throwable -> {
                                            log.error("Error while initialising git repo, {0}", throwable);
                                            return new AppsmithException(
                                                    AppsmithError.GIT_FILE_SYSTEM_ERROR,
                                                    Exceptions.unwrap(throwable).getMessage()
                                            );
                                        }),
                                        currentUserMono
                                )
                                .flatMap(tuple -> {

                                    UserData userData = tuple.getT2();
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
                                            false,
                                            false
                                    );
                                })
                                .flatMap(ignore -> {
                                    // Commit and push application to check if the SSH key has the write access
                                    GitCommitDTO commitDTO = new GitCommitDTO();
                                    commitDTO.setDoPush(true);
                                    commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.CONNECT_FLOW.getReason());


                                    return this.commitApplication(commitDTO, defaultApplicationId, application.getGitApplicationMetadata().getBranchName(), true)
                                            .onErrorResume(error ->
                                                // If the push fails remove all the cloned files from local repo
                                                this.detachRemote(defaultApplicationId)
                                                        .flatMap(isDeleted -> {
                                                            if (error instanceof TransportException) {
                                                                return addAnalyticsForGitOperation(
                                                                    AnalyticsEvents.GIT_CONNECT.getEventName(),
                                                                    application,
                                                                    error.getClass().getName(),
                                                                    error.getMessage(),
                                                                    application.getGitApplicationMetadata().getIsRepoPrivate()
                                                                )
                                                                .then(Mono.error(new AppsmithException(
                                                                        AppsmithError.INVALID_GIT_SSH_CONFIGURATION, error.getMessage()))
                                                                );
                                                        }
                                                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage()));
                                                    })
                                            );
                                })
                                .then(addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_CONNECT.getEventName(),
                                        application,
                                        application.getGitApplicationMetadata().getIsRepoPrivate()
                                ))
                                .map(responseUtils::updateApplicationWithDefaultResources);
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                });

        return Mono.create(sink -> connectApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<String> pushApplication(String defaultApplicationId, String branchName) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }
        return applicationService.findBranchedApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                .flatMap(applicationId -> pushApplication(applicationId, true));
    }

    /**
     * Push flow for dehydrated apps
     *
     * @param applicationId application which needs to be pushed to remote repo
     * @return Success message
     */
    private Mono<String> pushApplication(String applicationId, boolean doPublish) {

        Mono<String> pushStatusMono = publishAndOrGetApplication(applicationId, doPublish)
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

                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }
                    Path baseRepoSuffix =
                            Paths.get(application.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    GitAuth gitAuth = gitData.getGitAuth();
                    return gitExecutor.checkoutToBranch(baseRepoSuffix, application.getGitApplicationMetadata().getBranchName())
                            .then(gitExecutor.pushApplication(
                                    baseRepoSuffix,
                                    gitData.getRemoteUrl(),
                                    gitAuth.getPublicKey(),
                                    gitAuth.getPrivateKey(),
                                    gitData.getBranchName()
                                )
                                .zipWith(Mono.just(application))
                            )
                            .onErrorResume(error ->
                                addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_PUSH.getEventName(),
                                        application,
                                        error.getClass().getName(),
                                        error.getMessage(),
                                        application.getGitApplicationMetadata().getIsRepoPrivate()
                                )
                                .flatMap(application1 -> {
                                    if (error instanceof TransportException) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                    }
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage()));
                                })
                            );
                })
                .flatMap(tuple -> {
                    String pushResult = tuple.getT1();
                    Application application = tuple.getT2();
                    if (pushResult.contains("REJECTED")) {

                        return addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_PUSH.getEventName(),
                                application,
                                AppsmithError.GIT_UPSTREAM_CHANGES.getErrorType(),
                                AppsmithError.GIT_UPSTREAM_CHANGES.getMessage(),
                                application.getGitApplicationMetadata().getIsRepoPrivate()
                        )
                        .flatMap(application1 -> Mono.error(new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES)));
                    }
                    return Mono.just(pushResult).zipWith(Mono.just(tuple.getT2()));
                })
                // Add BE analytics
                .flatMap(tuple -> {
                    String pushStatus = tuple.getT1();
                    Application application = tuple.getT2();
                    return addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_PUSH.getEventName(),
                            application,
                            application.getGitApplicationMetadata().getIsRepoPrivate()
                    )
                    .thenReturn(pushStatus);
                });

        return Mono.create(sink -> pushStatusMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    /**
     * Method to remove all the git metadata for the application and connected resources. This will remove:
     * - local repo
     * - all the branched applications present in DB except for default application
     *
     * @param defaultApplicationId application which needs to be disconnected from git connection
     * @return Application data
     */
    @Override
    public Mono<Application> detachRemote(String defaultApplicationId) {

        Mono<Application> disconnectMono = getApplicationById(defaultApplicationId)
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
                    Path repoSuffix = Paths.get(defaultApplication.getWorkspaceId(), gitApplicationMetadata.getDefaultApplicationId(), repoName);
                    String defaultApplicationBranchName = gitApplicationMetadata.getBranchName();
                    String remoteUrl = gitApplicationMetadata.getRemoteUrl();
                    String privateKey = gitApplicationMetadata.getGitAuth().getPrivateKey();
                    String publicKey = gitApplicationMetadata.getGitAuth().getPublicKey();
                    return Mono.zip(
                            gitExecutor.listBranches(repoSuffix,
                                    remoteUrl,
                                    privateKey,
                                    publicKey,
                                    false),
                            Mono.just(defaultApplication),
                            Mono.just(repoSuffix),
                            Mono.just(defaultApplicationBranchName));
                })
                .flatMap(tuple -> {
                    Application defaultApplication = tuple.getT2();
                    Path repoSuffix = tuple.getT3();
                    List<String> branch = tuple.getT1()
                            .stream()
                            .map(GitBranchDTO::getBranchName)
                            .filter(branchName -> !branchName.startsWith("origin"))
                            .collect(Collectors.toList());

                    //Remove the parent application branch name from the list
                    branch.remove(tuple.getT4());
                    defaultApplication.setGitApplicationMetadata(null);
                    defaultApplication.getPages().forEach(page -> page.setDefaultPageId(page.getId()));
                    if (!CollectionUtils.isNullOrEmpty(defaultApplication.getPublishedPages())) {
                        defaultApplication.getPublishedPages().forEach(page -> page.setDefaultPageId(page.getId()));
                    }
                    return fileUtils.deleteLocalRepo(repoSuffix)
                            .flatMap(status -> Flux.fromIterable(branch)
                                    .flatMap(gitBranch ->
                                            applicationService
                                                    .findByBranchNameAndDefaultApplicationId(gitBranch, defaultApplicationId, MANAGE_APPLICATIONS)
                                                    .flatMap(applicationPageService::deleteApplicationByResource)
                                    )
                                    .then(applicationService.save(defaultApplication)));
                })
                .flatMap(application ->
                    // Update all the resources to replace defaultResource Ids with the resource Ids as branchName
                    // will be deleted
                    Flux.fromIterable(application.getPages())
                            .flatMap(page -> newPageService.findById(page.getId(), MANAGE_PAGES))
                            .map(newPage -> {
                                newPage.setDefaultResources(null);
                                return createDefaultIdsOrUpdateWithGivenResourceIds(newPage, null);
                            })
                            .collectList()
                            .flatMapMany(newPageService::saveAll)
                            .flatMap(newPage -> newActionService.findByPageId(newPage.getId(), MANAGE_ACTIONS)
                                    .map(newAction -> {
                                        newAction.setDefaultResources(null);
                                        if (newAction.getUnpublishedAction() != null) {
                                            newAction.getUnpublishedAction().setDefaultResources(null);
                                        }
                                        if (newAction.getPublishedAction() != null) {
                                            newAction.getPublishedAction().setDefaultResources(null);
                                        }
                                        return createDefaultIdsOrUpdateWithGivenResourceIds(newAction, null);
                                    })
                                    .collectList()
                                    .flatMapMany(newActionService::saveAll)
                                    .thenMany(actionCollectionService.findByPageId(newPage.getId()))
                                    .map(actionCollection -> {
                                        actionCollection.setDefaultResources(null);
                                        if (actionCollection.getUnpublishedCollection() != null) {
                                            actionCollection.getUnpublishedCollection().setDefaultResources(null);
                                        }
                                        if (actionCollection.getPublishedCollection() != null) {
                                            actionCollection.getPublishedCollection().setDefaultResources(null);
                                        }
                                        return createDefaultIdsOrUpdateWithGivenResourceIds(actionCollection, null);
                                    })
                                    .collectList()
                                    .flatMapMany(actionCollectionService::saveAll)
                            )
                            .then(addAnalyticsForGitOperation(AnalyticsEvents.GIT_DISCONNECT.getEventName(), application, false))
                            .map(responseUtils::updateApplicationWithDefaultResources)
                );

        return Mono.create(sink -> disconnectMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    public Mono<Application> createBranch(String defaultApplicationId, GitBranchDTO branchDTO, String srcBranch) {

        /*
        1. Check if the src application is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the application from source application reference
         */

        if (StringUtils.isEmptyOrNull(srcBranch)
                || srcBranch.startsWith("origin/")
                || branchDTO.getBranchName().startsWith("origin/")) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        Mono<Application> createBranchMono = applicationService
                .findByBranchNameAndDefaultApplicationId(srcBranch, defaultApplicationId, MANAGE_APPLICATIONS)
                .zipWhen(srcApplication -> {
                    GitApplicationMetadata gitData = srcApplication.getGitApplicationMetadata();
                    if (gitData.getDefaultApplicationId().equals(srcApplication.getId())) {
                        return Mono.just(srcApplication.getGitApplicationMetadata().getGitAuth());
                    }
                    return applicationService.getSshKey(gitData.getDefaultApplicationId())
                            .map(gitAuthDTO -> {
                                GitAuth gitAuth = new GitAuth();
                                gitAuth.setPrivateKey(gitAuthDTO.getPrivateKey());
                                gitAuth.setPublicKey(gitAuthDTO.getPublicKey());
                                gitAuth.setDocUrl(gitAuthDTO.getDocUrl());
                                return gitAuth;
                            });
                })
                .flatMap(tuple -> {
                    Application srcApplication = tuple.getT1();
                    GitAuth defaultGitAuth = tuple.getT2();
                    GitApplicationMetadata srcBranchGitData = srcApplication.getGitApplicationMetadata();
                    if (srcBranchGitData == null
                            || StringUtils.isEmptyOrNull(srcBranchGitData.getDefaultApplicationId())
                            || StringUtils.isEmptyOrNull(srcBranchGitData.getRepoName())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Unable to find the parent branch. Please create a branch from other available branches"
                        ));
                    }
                    Path repoSuffix = Paths.get(srcApplication.getWorkspaceId(), srcBranchGitData.getDefaultApplicationId(), srcBranchGitData.getRepoName());
                    // Create a new branch from the parent checked out branch
                    return gitExecutor.checkoutToBranch(repoSuffix, srcBranch)
                            .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", "Unable to find " + srcBranch)))
                            .zipWhen(isCheckedOut -> gitExecutor.fetchRemote(repoSuffix, defaultGitAuth.getPublicKey(), defaultGitAuth.getPrivateKey(), false, srcBranch, true)
                                    .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "fetch", error))))
                            .flatMap(ignore -> gitExecutor.listBranches(repoSuffix, srcBranchGitData.getRemoteUrl(), defaultGitAuth.getPrivateKey(), defaultGitAuth.getPublicKey(), false)
                                    .flatMap(branchList -> {
                                        boolean isDuplicateName = branchList.stream()
                                                // We are only supporting origin as the remote name so this is safe
                                                //  but needs to be altered if we start supporting user defined remote names
                                                .anyMatch(branch -> branch.getBranchName().replaceFirst("origin/", "")
                                                        .equals(branchDTO.getBranchName()));

                                        if (isDuplicateName) {
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                                    "remotes/origin/" + branchDTO.getBranchName(),
                                                    FieldName.BRANCH_NAME));
                                        }
                                        return gitExecutor.createAndCheckoutToBranch(repoSuffix, branchDTO.getBranchName());
                                    }))
                            .flatMap(branchName -> {
                                final String srcApplicationId = srcApplication.getId();
                                srcBranchGitData.setBranchName(branchName);
                                srcBranchGitData.setIsRepoPrivate(null);
                                // Save a new application in DB and update from the parent branch application
                                srcBranchGitData.setGitAuth(null);
                                srcBranchGitData.setLastCommittedAt(Instant.now());
                                srcApplication.setId(null);
                                srcApplication.setPages(null);
                                srcApplication.setPublishedPages(null);
                                srcApplication.setEditModeThemeId(null);
                                srcApplication.setPublishedModeThemeId(null);
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
                    return importExportApplicationService.importApplicationInWorkspace(
                            savedApplication.getWorkspaceId(),
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
                .flatMap(application -> addAnalyticsForGitOperation(
                        AnalyticsEvents.GIT_CREATE_BRANCH.getEventName(),
                        application,
                        application.getGitApplicationMetadata().getIsRepoPrivate())
                )
                .map(responseUtils::updateApplicationWithDefaultResources);

        return Mono.create(sink -> createBranchMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    public Mono<Application> checkoutBranch(String defaultApplicationId, String branchName) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        //If the user is trying to check out remote branch, create a new branch if the branch does not exist already
        if (branchName.startsWith("origin/")) {
            String finalBranchName = branchName.replaceFirst("origin/", "");
            return listBranchForApplication(defaultApplicationId, false, branchName)
                    .flatMap(gitBranchDTOList -> {
                        long branchMatchCount = gitBranchDTOList
                                .stream()
                                .filter(gitBranchDTO -> gitBranchDTO.getBranchName()
                                        .equals(finalBranchName)).count();
                        if(branchMatchCount == 0) {
                            return checkoutRemoteBranch(defaultApplicationId, finalBranchName);
                        } else {
                            return Mono.error(
                                    new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", branchName + " already exists in local - " + branchName.replaceFirst("origin/", "")));
                        }
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
                .flatMap(application -> addAnalyticsForGitOperation(
                        AnalyticsEvents.GIT_CHECKOUT_BRANCH.getEventName(),
                        application,
                        application.getGitApplicationMetadata().getIsRepoPrivate()
                ))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    private Mono<Application> checkoutRemoteBranch(String defaultApplicationId, String branchName) {
        Mono<Application> checkoutRemoteBranchMono = getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    String repoName = gitApplicationMetadata.getRepoName();
                    Path repoPath = Paths.get(application.getWorkspaceId(), defaultApplicationId, repoName);

                    return gitExecutor.fetchRemote(repoPath,
                            gitApplicationMetadata.getGitAuth().getPublicKey(),
                            gitApplicationMetadata.getGitAuth().getPrivateKey(),
                            false,
                            branchName,
                            true
                    ).flatMap(fetchStatus -> gitExecutor.checkoutRemoteBranch(repoPath, branchName).zipWith(Mono.just(application))
                                    .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout branch", error.getMessage()))));
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
                    srcBranchGitData.setBranchName(branchName);
                    srcBranchGitData.setDefaultApplicationId(defaultApplicationId);
                    // Save a new application in DB and update from the parent branch application
                    srcBranchGitData.setGitAuth(null);
                    srcBranchGitData.setIsRepoPrivate(null);
                    srcBranchGitData.setLastCommittedAt(Instant.now());
                    srcApplication.setId(null);
                    srcApplication.setPages(null);
                    srcApplication.setPublishedPages(null);
                    srcApplication.setGitApplicationMetadata(srcBranchGitData);

                    return applicationService.save(srcApplication)
                            .flatMap(application1 ->
                                    fileUtils.reconstructApplicationJsonFromGitRepo(srcApplication.getWorkspaceId(), defaultApplicationId, srcApplication.getGitApplicationMetadata().getRepoName(), branchName)
                                            .zipWith(Mono.just(application1))
                            )
                            // We need to handle the case specifically for default branch of Appsmith
                            // if user switches default branch and tries to delete the default branch we do not delete resource from db
                            // This is an exception only for the above case and in such case if the user tries to checkout the branch again
                            // It results in an error as the resources are already present in db
                            // So we just rehydrate from the file system to the existing resource on the db
                            .onErrorResume(throwable -> {
                                if (throwable instanceof DuplicateKeyException) {
                                    return fileUtils.reconstructApplicationJsonFromGitRepo(srcApplication.getWorkspaceId(), defaultApplicationId, srcApplication.getGitApplicationMetadata().getRepoName(), branchName)
                                            .zipWith(Mono.just(tuple.getT2()));
                                }
                                log.error(" Git checkout remote branch failed {}", throwable.getMessage());
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " --checkout", throwable.getMessage()));
                            });
                })
                .flatMap(tuple -> {
                    // Get the latest application mono with all the changes
                    ApplicationJson applicationJson = tuple.getT1();
                    Application application = tuple.getT2();
                    return importExportApplicationService
                            .importApplicationInWorkspace(application.getWorkspaceId(), applicationJson, application.getId(), branchName)
                            .flatMap(application1 -> addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_CHECKOUT_REMOTE_BRANCH.getEventName(),
                                    application1,
                                    application1.getGitApplicationMetadata().getIsRepoPrivate()
                            ))
                            .map(responseUtils::updateApplicationWithDefaultResources);
                });

        return Mono.create(sink -> checkoutRemoteBranchMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
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
        return applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)));
    }

    /**
     * Method to pull application json files from remote repo, make a commit with the changes present in local DB and
     * make a system commit to remote repo
     *
     * @param defaultApplicationId application for which we want to pull remote changes and merge
     * @param branchName    remoteBranch from which the changes will be pulled and merged
     * @return return the status of pull operation
     */
    @Override
    public Mono<GitPullDTO> pullApplication(String defaultApplicationId, String branchName) {
        /*
         * 1.Dehydrate the application from DB so that the file system has the latest application data
         * 2.Do git pull after the rehydration and merge the remote changes to the current branch
         *   On Merge conflict - throw exception and ask user to resolve these conflicts on remote
         *   TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to DB so that the latest changes from remote are rendered to the application
         * 4.Get the latest application from the DB and send it back to client
         * */

        Mono<GitPullDTO> pullMono = getApplicationById(defaultApplicationId)
                .flatMap(defaultApplication -> {
                    GitApplicationMetadata defaultGitMetadata = defaultApplication.getGitApplicationMetadata();
                    return Mono.zip(Mono.just(defaultApplication), getStatus(defaultGitMetadata.getDefaultApplicationId(), branchName));
                })
                .flatMap(tuple -> {
                    Application defaultApplication = tuple.getT1();
                    GitStatusDTO status = tuple.getT2();
                    // Check if the repo is clean
                    if (!CollectionUtils.isNullOrEmpty(status.getModified())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                "pull",
                                "There are uncommitted changes present in your local. Please commit them first and then try git pull"));
                    }
                    return pullAndRehydrateApplication(defaultApplication, branchName);
                });

        return Mono.create(sink -> pullMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<List<GitBranchDTO>> listBranchForApplication(String defaultApplicationId, Boolean pruneBranches, String currentBranch) {
        Mono<List<GitBranchDTO>> branchMono = getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (gitApplicationMetadata == null || gitApplicationMetadata.getDefaultApplicationId() == null) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }
                    Path repoPath = Paths.get(application.getWorkspaceId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());

                    Mono<List<GitBranchDTO>> gitBranchDTOMono;
                    // Fetch remote first if the prune branch is valid
                    if(Boolean.TRUE.equals(pruneBranches)) {
                        gitBranchDTOMono = gitExecutor.fetchRemote(
                                repoPath,
                                gitApplicationMetadata.getGitAuth().getPublicKey(),
                                gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                false,
                                currentBranch,
                                true)
                                .flatMap(s -> gitExecutor.listBranches(
                                        repoPath,
                                        gitApplicationMetadata.getRemoteUrl(),
                                        gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                        gitApplicationMetadata.getGitAuth().getPublicKey(),
                                        true));
                    } else {
                        // Fetch default branch from DB if the pruneBranches is false else fetch from remote
                        gitBranchDTOMono = gitExecutor.listBranches(
                                repoPath,
                                gitApplicationMetadata.getRemoteUrl(),
                                gitApplicationMetadata.getGitAuth().getPrivateKey(),
                                gitApplicationMetadata.getGitAuth().getPublicKey(),
                                false);
                    }
                    return Mono.zip(gitBranchDTOMono, Mono.just(application))
                            .onErrorResume(error -> {
                                if (error instanceof RepositoryNotFoundException) {
                                    Mono<List<GitBranchDTO>> branchListMono = handleRepoNotFoundException(defaultApplicationId);
                                    return Mono.zip(branchListMono, Mono.just(application), Mono.just(repoPath));
                                }
                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED,
                                        "branch --list",
                                        error.getMessage()));
                            }
                    );

                })
                .flatMap(tuple -> {
                    List<GitBranchDTO> gitBranchListDTOS = tuple.getT1();
                    Application application = tuple.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
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

                        if(defaultBranchRemote.equals(dbDefaultBranch)) {
                            return Mono.just(gitBranchListDTOS).zipWith(Mono.just(application));
                        } else {
                            // Get the application from DB by new defaultBranch name
                            return applicationService.findByBranchNameAndDefaultApplicationId(defaultBranchRemote, defaultApplicationId, MANAGE_APPLICATIONS)
                                    // Check if the branch is already present, If not follow checkout remote flow
                                    .onErrorResume(throwable -> checkoutRemoteBranch(defaultApplicationId, defaultBranchRemote))
                                    // Update the default branch name in all the child applications
                                    .flatMapMany(application1 -> applicationService.findAllApplicationsByDefaultApplicationId(defaultApplicationId, MANAGE_APPLICATIONS)
                                            .flatMap(application2 -> {
                                                application2.getGitApplicationMetadata().setDefaultBranchName(defaultBranchRemote);
                                                return applicationService.save(application2);
                                            }))
                                    // Return the deleted branches
                                    .then(Mono.just(gitBranchListDTOS).zipWith(Mono.just(application)));
                        }
                    } else {
                        gitBranchListDTOS
                                .stream()
                                .filter(branchDTO -> StringUtils.equalsIgnoreCase(branchDTO.getBranchName(), dbDefaultBranch))
                                .findFirst()
                                .ifPresent(branchDTO -> branchDTO.setDefault(true));
                        return Mono.just(gitBranchListDTOS).zipWith(Mono.just(application));
                    }
                })
                // Add BE analytics
                .flatMap(tuple -> {
                    List<GitBranchDTO> gitBranchDTOList = tuple.getT1();
                    Application application = tuple.getT2();
                    return Boolean.FALSE.equals(pruneBranches)
                            ? Mono.just(gitBranchDTOList)
                            : addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_PRUNE.getEventName(),
                                    application,
                                    application.getGitApplicationMetadata().getIsRepoPrivate()
                            )
                            .thenReturn(gitBranchDTOList);
                });

        return Mono.create(sink -> branchMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
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


        Mono<GitStatusDTO> statusMono = Mono.zip(
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
                            Paths.get(application.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    try {
                        return Mono.zip(
                                fileUtils.saveApplicationToLocalRepo(repoSuffix, applicationJson, finalBranchName),
                                Mono.just(gitData.getGitAuth()),
                                Mono.just(repoSuffix)
                        );
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Mono<GitStatusDTO> branchedStatusMono = gitExecutor.getStatus(tuple.getT1(), finalBranchName).cache();
                    try {
                        return gitExecutor.fetchRemote(tuple.getT1(), tuple.getT2().getPublicKey(), tuple.getT2().getPrivateKey(), true, branchName, false)
                                .then(branchedStatusMono)
                                // Remove any files which are copied by hard resetting the repo
                                .then(gitExecutor.resetToLastCommit(tuple.getT3(), branchName))
                                .then(branchedStatusMono)
                                .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", error.getMessage())));
                    } catch (GitAPIException | IOException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR, e.getMessage()));
                    }
                });

        return Mono.create(sink -> statusMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<MergeStatusDTO> mergeBranch(String defaultApplicationId, GitMergeDTO gitMergeDTO) {
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

        Mono<MergeStatusDTO> mergeMono = getApplicationById(defaultApplicationId)
                .flatMap(defaultApplication -> {
                    GitApplicationMetadata gitApplicationMetadata = defaultApplication.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(defaultApplication.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoSuffix = Paths.get(defaultApplication.getWorkspaceId(),
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
                    )
                    .onErrorResume(error -> {
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
                            gitExecutor.mergeBranch(repoSuffix, sourceBranch, destinationBranch),
                            Mono.just(defaultApplication)
                    )
                    .onErrorResume(error -> addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_MERGE.getEventName(),
                            defaultApplication,
                            error.getClass().getName(),
                            error.getMessage(),
                            defaultApplication.getGitApplicationMetadata().getIsRepoPrivate()
                        )
                        .flatMap(application -> {
                            if (error instanceof GitAPIException) {
                                return Mono.error(new AppsmithException(AppsmithError.GIT_MERGE_CONFLICTS, error.getMessage()));
                            }
                            return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "merge", error.getMessage()));
                        })
                    );
                })
                .flatMap(mergeStatusTuple -> {
                    Application defaultApplication = mergeStatusTuple.getT2();
                    String mergeStatus = mergeStatusTuple.getT1();

                    //3. rehydrate from file system to db
                    Mono<ApplicationJson> applicationJson = fileUtils.reconstructApplicationJsonFromGitRepo(
                            defaultApplication.getWorkspaceId(),
                            defaultApplication.getGitApplicationMetadata().getDefaultApplicationId(),
                            defaultApplication.getGitApplicationMetadata().getRepoName(),
                            destinationBranch);
                    return Mono.zip(
                            Mono.just(mergeStatus),
                            applicationService
                                    .findByBranchNameAndDefaultApplicationId(destinationBranch, defaultApplicationId, MANAGE_APPLICATIONS),
                            applicationJson
                    );
                })
                .flatMap(tuple -> {
                    Application destApplication = tuple.getT2();
                    ApplicationJson applicationJson = tuple.getT3();
                    MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
                    mergeStatusDTO.setStatus(tuple.getT1());
                    mergeStatusDTO.setMergeAble(Boolean.TRUE);

                    //4. Get the latest application mono with all the changes
                    return importExportApplicationService
                            .importApplicationInWorkspace(destApplication.getWorkspaceId(), applicationJson, destApplication.getId(), destinationBranch.replaceFirst("origin/", ""))
                            .flatMap(application1 -> {
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setDoPush(true);
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.SYNC_REMOTE_AFTER_MERGE.getReason() + sourceBranch);
                                return this.commitApplication(commitDTO, defaultApplicationId, destinationBranch)
                                        .map(commitStatus -> mergeStatusDTO)
                                        .zipWith(Mono.just(application1));
                            });
                })
                .flatMap(tuple -> {
                    MergeStatusDTO mergeStatusDTO = tuple.getT1();
                    Application application = tuple.getT2();
                    // Send analytics event
                    return addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_MERGE.getEventName(),
                            application,
                            application.getGitApplicationMetadata().getIsRepoPrivate()
                    )
                    .thenReturn(mergeStatusDTO);
                });

        return Mono.create(sink -> mergeMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
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

        Mono<MergeStatusDTO> mergeableStatusMono = getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoSuffix = Paths.get(application.getWorkspaceId(),
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
                                                mergeStatus.setReferenceDoc(ErrorReferenceDocUrl.GIT_MERGE_CONFLICT.getDocUrl());
                                                return mergeStatus;
                                            });
                                } catch (GitAPIException | IOException e) {
                                    log.error("Error while resetting to last commit", e);
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "reset --hard HEAD", e.getMessage()));
                                }
                            });
                });

        return Mono.create(sink -> mergeableStatusMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<String> createConflictedBranch(String defaultApplicationId, String branchName) {
        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        Mono<String> conflictedBranchMono = Mono.zip(
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
                            Paths.get(application.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

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
                    GitApplicationMetadata gitData = tuple.getT2();
                    Path repoSuffix = tuple.getT3();
                    return gitExecutor.createAndCheckoutToBranch(repoSuffix, branchName + MERGE_CONFLICT_BRANCH_NAME)
                            .flatMap(conflictedBranchName ->
                                    commitAndPushWithDefaultCommit(repoSuffix, gitData.getGitAuth(), gitData, DEFAULT_COMMIT_REASONS.CONFLICT_STATE)
                                            .flatMap(successMessage -> gitExecutor.checkoutToBranch(repoSuffix, branchName))
                                            .flatMap(isCheckedOut -> gitExecutor.deleteBranch(repoSuffix, conflictedBranchName))
                                            .thenReturn(conflictedBranchName + CONFLICTED_SUCCESS_MESSAGE)
                            );
                });

        return Mono.create(sink -> conflictedBranchMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<ApplicationImportDTO> importApplicationFromGit(String workspaceId, GitConnectDTO gitConnectDTO) {
        // 1. Check private repo limit for workspace
        // 2. Create dummy application, clone repo from remote
        // 3. Re-hydrate application to DB from local repo
        //    1. Save the ssh keys in application object with other details
        //    2. During import-export need to handle the DS(empty vs non-empty)
        // 4. Return application

        if (StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        if (StringUtils.isEmptyOrNull(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid workspace id"));
        }

        final String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
        Mono<Boolean> isPrivateRepoMono = GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl())).cache();
        Mono<ApplicationImportDTO> importedApplicationMono = getSSHKeyForCurrentUser()
                .zipWith(isPrivateRepoMono)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git configuration for logged-in user. Please contact Appsmith team for support")))
                //Check the limit for number of private repo
                .flatMap(tuple -> {
                    // Check if the repo is public
                    Application newApplication = new Application();
                    newApplication.setName(repoName);
                    newApplication.setWorkspaceId(workspaceId);
                    newApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                    GitAuth gitAuth = tuple.getT1();
                    boolean isRepoPrivate = tuple.getT2();
                    Mono<Application> applicationMono = applicationPageService
                            .createOrUpdateSuffixedApplication(newApplication, newApplication.getName(), 0);
                    if(!isRepoPrivate) {
                        return Mono.just(gitAuth).zipWith(applicationMono);
                    }
                    return gitCloudServicesUtils.getPrivateRepoLimitForOrg(workspaceId, true)
                            .flatMap(limitCount -> {
                                // CS will respond with count -1 for unlimited git repos
                                if (limitCount == -1) {
                                    return Mono.just(gitAuth).zipWith(applicationMono);
                                }
                                // get git connected apps count from db
                                return this.getApplicationCountWithPrivateRepo(workspaceId)
                                        .flatMap(count -> {
                                            if (limitCount <= count) {
                                                return addAnalyticsForGitOperation(
                                                        AnalyticsEvents.GIT_IMPORT.getEventName(),
                                                        newApplication,
                                                        AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                                        AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                                        false
                                                ).flatMap(user -> Mono.error(new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
                                            }
                                            return Mono.just(gitAuth).zipWith(applicationMono);
                                        });
                            });
                })
                .flatMap(tuple -> {
                    GitAuth gitAuth = tuple.getT1();
                    Application application = tuple.getT2();
                    Path repoSuffix = Paths.get(application.getWorkspaceId(), application.getId(), repoName);
                    Mono<Map<String, GitProfile>> profileMono = updateOrCreateGitProfileForCurrentUser(gitConnectDTO.getGitProfile(), application.getId());

                    Mono<String> defaultBranchMono = gitExecutor.cloneApplication(
                            repoSuffix,
                            gitConnectDTO.getRemoteUrl(),
                            gitAuth.getPrivateKey(),
                            gitAuth.getPublicKey()
                    ).onErrorResume(error -> {
                        log.error("Error while cloning the remote repo, {}", error.getMessage());
                        return addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_IMPORT.getEventName(),
                                application,
                                error.getClass().getName(),
                                error.getMessage(),
                                false)
                                .flatMap(user -> fileUtils.deleteLocalRepo(repoSuffix)
                                        .then(applicationPageService.deleteApplication(application.getId())))
                                .flatMap(application1 -> {
                                    if (error instanceof TransportException) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, error.getMessage()));
                                    } else if (error instanceof InvalidRemoteException) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "remote url"));
                                    } else if (error instanceof TimeoutException) {
                                        return Mono.error(new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                    }
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "clone", error));
                                });
                    });

                    return defaultBranchMono
                            .zipWith(isPrivateRepoMono)
                            .flatMap(tuple2 -> {
                                String defaultBranch = tuple2.getT1();
                                boolean isRepoPrivate = tuple2.getT2();
                                GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
                                gitApplicationMetadata.setGitAuth(gitAuth);
                                gitApplicationMetadata.setDefaultApplicationId(application.getId());
                                gitApplicationMetadata.setBranchName(defaultBranch);
                                gitApplicationMetadata.setDefaultBranchName(defaultBranch);
                                gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                gitApplicationMetadata.setRepoName(repoName);
                                gitApplicationMetadata.setBrowserSupportedRemoteUrl(
                                        GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl())
                                );
                                gitApplicationMetadata.setIsRepoPrivate(isRepoPrivate);
                                gitApplicationMetadata.setLastCommittedAt(Instant.now());

                                application.setGitApplicationMetadata(gitApplicationMetadata);
                                return Mono.just(application).zipWith(profileMono);
                            });
                })
                .flatMap(objects -> {
                    Application application = objects.getT1();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    String defaultBranch = gitApplicationMetadata.getDefaultBranchName();


                    Mono<List<Datasource>> datasourceMono = datasourceService.findAllByWorkspaceId(workspaceId, MANAGE_DATASOURCES).collectList();
                    Mono<List<Plugin>> pluginMono = pluginService.getDefaultPlugins().collectList();
                    Mono<ApplicationJson> applicationJsonMono = fileUtils
                            .reconstructApplicationJsonFromGitRepo(workspaceId, application.getId(), gitApplicationMetadata.getRepoName(), defaultBranch)
                            .onErrorResume(error -> {
                                log.error("Error while constructing application from git repo", error);
                                return deleteApplicationCreatedFromGitImport(application.getId(), application.getWorkspaceId(), gitApplicationMetadata.getRepoName())
                                        .flatMap(application1 -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, error.getMessage())));
                            });

                    return Mono.zip(applicationJsonMono, datasourceMono, pluginMono)
                            .flatMap(data -> {
                                ApplicationJson applicationJson = data.getT1();
                                List<Datasource> datasourceList = data.getT2();
                                List<Plugin> pluginList = data.getT3();

                                if(Optional.ofNullable(applicationJson.getExportedApplication()).isEmpty()
                                        || applicationJson.getPageList().isEmpty()) {
                                    return deleteApplicationCreatedFromGitImport(application.getId(), application.getWorkspaceId(), gitApplicationMetadata.getRepoName())
                                            .then(Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "import", "Cannot import app from an empty repo")));
                                }

                                // If there is an existing datasource with the same name but a different type from that in the repo, the import api should fail
                                if(checkIsDatasourceNameConflict(datasourceList, applicationJson.getDatasourceList(), pluginList)) {
                                    return deleteApplicationCreatedFromGitImport(application.getId(), application.getWorkspaceId(), gitApplicationMetadata.getRepoName())
                                            .then(Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED,
                                                    "import",
                                                    "Datasource already exists with the same name"))
                                            );
                                }

                                applicationJson.getExportedApplication().setGitApplicationMetadata(gitApplicationMetadata);
                                return importExportApplicationService
                                        .importApplicationInWorkspace(workspaceId, applicationJson, application.getId(), defaultBranch)
                                        .onErrorResume(throwable ->
                                                deleteApplicationCreatedFromGitImport(application.getId(), application.getWorkspaceId(), gitApplicationMetadata.getRepoName())
                                                    .flatMap(application1 -> Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, throwable.getMessage())))
                                        );
                            });
                })
                // Add un-configured datasource to the list to response
                .flatMap(application -> importExportApplicationService.findDatasourceByApplicationId(application.getId(), application.getWorkspaceId())
                        .map(datasources -> {
                            ApplicationImportDTO applicationImportDTO = new ApplicationImportDTO();
                            applicationImportDTO.setApplication(application);
                            long unConfiguredDatasource = datasources.stream().filter(datasource -> Boolean.FALSE.equals(datasource.getIsConfigured())).count();
                            if (unConfiguredDatasource != 0) {
                                applicationImportDTO.setIsPartialImport(true);
                                applicationImportDTO.setUnConfiguredDatasourceList(datasources);
                            } else {
                                applicationImportDTO.setIsPartialImport(false);
                            }
                            return applicationImportDTO;
                        }))
                // Add analytics event
                .flatMap(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    return addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_IMPORT.getEventName(),
                            application,
                            application.getGitApplicationMetadata().getIsRepoPrivate()
                    ).thenReturn(applicationImportDTO);
                });

        return Mono.create(sink -> importedApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<GitAuth> generateSSHKey(String keyType) {
        GitAuth gitAuth = GitDeployKeyGenerator.generateSSHKey(keyType);

        GitDeployKeys gitDeployKeys = new GitDeployKeys();
        gitDeployKeys.setGitAuth(gitAuth);

        return sessionUserService.getCurrentUser()
                .flatMap(user -> {
                    gitDeployKeys.setEmail(user.getEmail());
                    return gitDeployKeysRepository.findByEmail(user.getEmail())
                            .switchIfEmpty(gitDeployKeysRepository.save(gitDeployKeys))
                            .flatMap(gitDeployKeys1 -> {
                                if (gitDeployKeys.equals(gitDeployKeys1)) {
                                    return Mono.just(gitDeployKeys1);
                                }
                                // Overwrite the existing keys
                                gitDeployKeys1.setGitAuth(gitDeployKeys.getGitAuth());
                                return gitDeployKeysRepository.save(gitDeployKeys1);
                            });
                })
                .thenReturn(gitAuth);
    }

    @Override
    public Mono<Boolean> testConnection(String defaultApplicationId) {
        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(gitApplicationMetadata)) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    return gitExecutor.testConnection(
                            gitApplicationMetadata.getGitAuth().getPublicKey(),
                            gitApplicationMetadata.getGitAuth().getPrivateKey(),
                            gitApplicationMetadata.getRemoteUrl()
                    ).zipWith(Mono.just(application))
                            .onErrorResume(error -> {
                                log.error("Error while testing the connection to th remote repo " + gitApplicationMetadata.getRemoteUrl() + " ", error);
                                return addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_TEST_CONNECTION.getEventName(),
                                        application,
                                        error.getClass().getName(),
                                        error.getMessage(),
                                        application.getGitApplicationMetadata().getIsRepoPrivate()
                                ).flatMap(application1 -> {
                                    if (error instanceof TransportException) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                    }
                                    if (error instanceof InvalidRemoteException) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, error.getMessage()));
                                    }
                                    if (error instanceof TimeoutException) {
                                        return Mono.error(new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                    }
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR, error.getMessage()));
                                });

                            });
                })
                .flatMap(objects -> {
                    Application application = objects.getT2();
                    return addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_TEST_CONNECTION.getEventName(),
                            application,
                            application.getGitApplicationMetadata().getIsRepoPrivate()
                    ).thenReturn(objects.getT1());
                });
    }

    @Override
    public Mono<Application> deleteBranch(String defaultApplicationId, String branchName) {
        Mono<Application> deleteBranchMono = getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Path repoPath = Paths.get(application.getWorkspaceId(), defaultApplicationId, gitApplicationMetadata.getRepoName());
                    if(branchName.equals(gitApplicationMetadata.getDefaultBranchName())) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "delete branch", " Cannot delete default branch"));
                    }
                    return gitExecutor.deleteBranch(repoPath, branchName)
                            .onErrorResume(throwable -> {
                                log.error("Delete branch failed {}", throwable.getMessage());
                                if(throwable instanceof CannotDeleteCurrentBranchException) {
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "delete branch", "Cannot delete current checked out branch"));
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "delete branch", throwable.getMessage()));
                            })
                            .flatMap(isBranchDeleted -> {
                                if(Boolean.FALSE.equals(isBranchDeleted)) {
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " delete branch. Branch does not exists in the repo"));
                                }
                                return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                                        .flatMap(application1 -> {
                                            if(application1.getId().equals(application1.getGitApplicationMetadata().getDefaultApplicationId())) {
                                                return Mono.just(application1);
                                            }
                                            return applicationPageService.deleteApplicationByResource(application1);
                                        })
                                        .onErrorResume(throwable -> {
                                            log.warn("Unable to find branch with name ", throwable);
                                            return addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_DELETE_BRANCH.getEventName(),
                                                    application,
                                                    throwable.getClass().getName(),
                                                    throwable.getMessage(),
                                                    gitApplicationMetadata.getIsRepoPrivate()
                                            ).flatMap(application1 -> Mono.just(application1));
                                        });
                            });
                })
                .flatMap(application -> addAnalyticsForGitOperation(AnalyticsEvents.GIT_DELETE_BRANCH.getEventName(), application, application.getGitApplicationMetadata().getIsRepoPrivate()))
                .map(responseUtils::updateApplicationWithDefaultResources);

        return Mono.create(sink -> deleteBranchMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<Application> discardChanges(String defaultApplicationId, String branchName, Boolean doPull) {

        if (StringUtils.isEmptyOrNull(defaultApplicationId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }
        Mono<Application> branchedApplicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                .cache();
        Mono<Application> defaultApplicationMono = this.getApplicationById(defaultApplicationId);

        Mono<Application> discardChangeMono;
        if (Boolean.TRUE.equals(doPull)) {
            discardChangeMono = defaultApplicationMono
                    .flatMap(defaultApplication -> this.pullAndRehydrateApplication(defaultApplication, branchName))
                    .map(GitPullDTO::getApplication)
                    .flatMap(application -> this.addAnalyticsForGitOperation(AnalyticsEvents.GIT_DISCARD_CHANGES.getEventName(), application, null))
                    .map(responseUtils::updateApplicationWithDefaultResources);
        } else {
            // Rehydrate the application from local file system
            discardChangeMono = branchedApplicationMono
                    .flatMap(branchedApplication -> {
                        GitApplicationMetadata gitData = branchedApplication.getGitApplicationMetadata();
                        if (gitData == null || StringUtils.isEmptyOrNull(gitData.getDefaultApplicationId())) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                        }
                        Path repoSuffix = Paths.get(branchedApplication.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                        return gitExecutor.checkoutToBranch(repoSuffix, branchName)
                                        .then(fileUtils.reconstructApplicationJsonFromGitRepo(
                                                branchedApplication.getWorkspaceId(),
                                                branchedApplication.getGitApplicationMetadata().getDefaultApplicationId(),
                                                branchedApplication.getGitApplicationMetadata().getRepoName(),
                                                branchName)
                                        )
                                .flatMap(applicationJson ->
                                    importExportApplicationService
                                            .importApplicationInWorkspace(branchedApplication.getWorkspaceId(), applicationJson, branchedApplication.getId(), branchName)
                                );
                    })
                    .flatMap(application -> this.addAnalyticsForGitOperation(AnalyticsEvents.GIT_DISCARD_CHANGES.getEventName(), application, null))
                    .map(responseUtils::updateApplicationWithDefaultResources);
        }

        return Mono.create(sink -> discardChangeMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    /**
     * In some scenarios:
     * connect: after loading the modal, keyTypes is not available, so a network call has to be made to ssh-keypair.
     * import: cannot make a ssh-keypair call because application Id doesn’t exist yet, so API fails.
     * @return Git docs urls for all the scenarios, client will cache this data and use it
     */
    @Override
    public Mono<List<GitDocsDTO>> getGitDocUrls() {
        ErrorReferenceDocUrl[] docSet = ErrorReferenceDocUrl.values();
        List<GitDocsDTO> gitDocsDTOList = new ArrayList<>();
        for(ErrorReferenceDocUrl docUrl : docSet ) {
            GitDocsDTO gitDocsDTO = new GitDocsDTO();
            gitDocsDTO.setDocKey(docUrl);
            gitDocsDTO.setDocUrl(docUrl.getDocUrl());
            gitDocsDTOList.add(gitDocsDTO);
        }
        return Mono.just(gitDocsDTOList);
    }

    private Mono<Application> deleteApplicationCreatedFromGitImport(String applicationId, String workspaceId, String repoName) {
        Path repoSuffix = Paths.get(workspaceId, applicationId, repoName);
        return fileUtils.deleteLocalRepo(repoSuffix)
                .then(applicationPageService.deleteApplication(applicationId));
    }


    private Mono<GitAuth> getSSHKeyForCurrentUser() {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> gitDeployKeysRepository.findByEmail(user.getEmail()))
                .map(GitDeployKeys::getGitAuth);
    }

    private boolean checkIsDatasourceNameConflict(List<Datasource> existingDatasources,
                                                  List<Datasource> importedDatasources,
                                                  List<Plugin> pluginList) {
        // If we have an existing datasource with the same name but a different type from that in the repo, the import api should fail
        for( Datasource datasource : importedDatasources) {
            // Collect the datasource(existing in workspace) which has same as of imported datasource
            // As names are unique we will need filter first element to check if the plugin id is matched
             Datasource filteredDatasource = existingDatasources
                     .stream()
                     .filter(datasource1 -> datasource1.getName().equals(datasource.getName()))
                     .findFirst()
                     .orElse(null);

             // Check if both of the datasource's are of the same plugin type
             if (filteredDatasource != null) {
                 long matchCount = pluginList.stream()
                         .filter(plugin -> {
                             final String pluginReference = plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName();

                             return plugin.getId().equals(filteredDatasource.getPluginId())
                                     && !datasource.getPluginId().equals(pluginReference);
                         })
                         .count();
                 if (matchCount > 0) {
                     return true;
                 }
             }

        }
        return false;
    }

    private boolean isInvalidDefaultApplicationGitMetadata(GitApplicationMetadata gitApplicationMetadata) {
        return Optional.ofNullable(gitApplicationMetadata).isEmpty()
                || Optional.ofNullable(gitApplicationMetadata.getGitAuth()).isEmpty()
                || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPrivateKey())
                || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPublicKey());
    }

    private Mono<String> commitAndPushWithDefaultCommit(Path repoSuffix,
                                                        GitAuth auth,
                                                        GitApplicationMetadata gitApplicationMetadata,
                                                        DEFAULT_COMMIT_REASONS reason) {
        return gitExecutor.commitApplication(repoSuffix, DEFAULT_COMMIT_MESSAGE + reason.getReason(), APPSMITH_BOT_USERNAME, emailConfig.getSupportEmailAddress(), true, false)
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
                                        throw new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES);
                                    }
                                    return pushResult;
                                })
                );
    }

    public Mono<List<GitBranchDTO>> handleRepoNotFoundException(String defaultApplicationId) {

        // clone application to the local filesystem again and update the defaultBranch for the application
        // list branch and compare with branch applications and checkout if not exists

        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Path repoPath = Paths.get(application.getWorkspaceId(), application.getId(), gitApplicationMetadata.getRepoName());
                    GitAuth gitAuth = gitApplicationMetadata.getGitAuth();
                    return gitExecutor.cloneApplication(repoPath, gitApplicationMetadata.getRemoteUrl(), gitAuth.getPrivateKey(), gitAuth.getPublicKey())
                            .flatMap(defaultBranch -> gitExecutor.listBranches(
                                    repoPath,
                                    gitApplicationMetadata.getRemoteUrl(),
                                    gitAuth.getPrivateKey(),
                                    gitAuth.getPublicKey(),
                                    false))
                            .flatMap(gitBranchDTOList -> {
                                List<String> branchList = gitBranchDTOList.stream()
                                        .filter(gitBranchDTO -> gitBranchDTO.getBranchName().contains("origin"))
                                        .map(gitBranchDTO -> gitBranchDTO.getBranchName().replace("origin/", ""))
                                        .collect(Collectors.toList());
                                // Remove the default branch of Appsmith
                                branchList.remove(gitApplicationMetadata.getBranchName());

                                return Flux.fromIterable(branchList)
                                        .flatMap(branchName -> applicationService.findByBranchNameAndDefaultApplicationId(branchName, application.getId(), READ_APPLICATIONS)
                                                // checkout the branch locally
                                                .flatMap(application1 -> {
                                                    // Add the locally checked out branch to the branchList
                                                    GitBranchDTO gitBranchDTO = new GitBranchDTO();
                                                    gitBranchDTO.setBranchName(branchName);
                                                    gitBranchDTO.setDefault(false);
                                                    gitBranchDTOList.add(gitBranchDTO);
                                                    return gitExecutor.checkoutRemoteBranch(repoPath, branchName);
                                                })
                                                // Return empty mono when the branched application is not in db
                                                .onErrorResume(throwable -> Mono.empty()))
                                        .then(Mono.just(gitBranchDTOList));
                            });
                });
    }

    private Mono<Long> getApplicationCountWithPrivateRepo(String workspaceId) {
        return applicationService.getGitConnectedApplicationsByWorkspaceId(workspaceId)
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    final Boolean isRepoPrivate = gitData.getIsRepoPrivate();
                    return GitUtils.isRepoPrivate(application.getGitApplicationMetadata().getBrowserSupportedRemoteUrl())
                            .flatMap(isPrivate -> {
                                if (!isRepoPrivate.equals(gitData.getIsRepoPrivate())) {
                                    // Repo accessibility is changed
                                    return applicationService.save(application);
                                }
                                return Mono.just(application);
                            });
                })
                .then(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(workspaceId));
    }

    /**
     * Method to pull the files from remote repo and rehydrate the application
     *
     * @param defaultApplication application which acts as the root for the concerned branch
     * @param branchName         branch for which the pull is required
     * @return                   pull DTO with updated application
     */
    private Mono<GitPullDTO> pullAndRehydrateApplication(Application defaultApplication, String branchName) {

        /*
        1. Checkout to the concerned branch
        2. Do git pull after
            On Merge conflict - throw exception and ask user to resolve these conflicts on remote
            TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
        3. Rehydrate the application from filesystem so that the latest changes from remote are rendered to the application
        */
        GitApplicationMetadata gitData = defaultApplication.getGitApplicationMetadata();
        if (isInvalidDefaultApplicationGitMetadata(gitData)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }
        Path repoSuffix = Paths.get(defaultApplication.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

        Mono<Application> branchedApplicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(branchName, defaultApplication.getId(), MANAGE_APPLICATIONS);

        return branchedApplicationMono
            .flatMap(branchedApplication -> {

                // git checkout and pull origin branchName
                try {
                    Mono<MergeStatusDTO> pullStatusMono = gitExecutor.checkoutToBranch(repoSuffix, branchName)
                            .then(gitExecutor.pullApplication(
                                    repoSuffix,
                                    gitData.getRemoteUrl(),
                                    branchName,
                                    gitData.getGitAuth().getPrivateKey(),
                                    gitData.getGitAuth().getPublicKey()
                            ))
                            .onErrorResume(error -> {
                                if(error.getMessage().contains("conflict")) {
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_PULL_CONFLICTS, error.getMessage()));
                                }
                                else if (error.getMessage().contains("Nothing to fetch")) {
                                    MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                    mergeStatus.setStatus("Nothing to fetch from remote. All changes are up to date.");
                                    mergeStatus.setMergeAble(true);
                                    return Mono.just(mergeStatus);
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", error.getMessage()));
                            })
                            .cache();
                    // Rehydrate the application from file system
                    Mono<ApplicationJson> applicationJsonMono = pullStatusMono
                            .flatMap(status ->
                                    fileUtils.reconstructApplicationJsonFromGitRepo(
                                            branchedApplication.getWorkspaceId(),
                                            branchedApplication.getGitApplicationMetadata().getDefaultApplicationId(),
                                            branchedApplication.getGitApplicationMetadata().getRepoName(),
                                            branchName
                                    )
                            );

                    return Mono.zip(pullStatusMono, Mono.just(branchedApplication), applicationJsonMono);
                } catch (IOException e) {
                    return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                }
            })
            .flatMap(tuple -> {
                MergeStatusDTO status = tuple.getT1();
                Application branchedApplication = tuple.getT2();
                ApplicationJson applicationJson = tuple.getT3();

                // Get the latest application with all the changes
                // Commit and push changes to sync with remote
                return importExportApplicationService
                        .importApplicationInWorkspace(branchedApplication.getWorkspaceId(), applicationJson, branchedApplication.getId(), branchName)
                        .flatMap(application -> addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_PULL.getEventName(),
                                        application,
                                        application.getGitApplicationMetadata().getIsRepoPrivate()
                                    )
                                    .thenReturn(application)
                        )
                        .flatMap(application -> {
                            GitCommitDTO commitDTO = new GitCommitDTO();
                            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + DEFAULT_COMMIT_REASONS.SYNC_WITH_REMOTE_AFTER_PULL.getReason());
                            commitDTO.setDoPush(true);

                            GitPullDTO gitPullDTO = new GitPullDTO();
                            gitPullDTO.setMergeStatus(status);
                            gitPullDTO.setApplication(responseUtils.updateApplicationWithDefaultResources(application));

                            // Make commit and push after pull is successful to have a clean repo
                            return this.commitApplication(commitDTO, application.getGitApplicationMetadata().getDefaultApplicationId(), branchName)
                                    .thenReturn(gitPullDTO);
                        });
            });
    }

    private Mono<Application> addAnalyticsForGitOperation(String eventName, Application application, Boolean isRepoPrivate) {
        return addAnalyticsForGitOperation(eventName, application, "", "", isRepoPrivate, false);
    }

    private Mono<Application> addAnalyticsForGitOperation(String eventName,
                                                          Application application,
                                                          String errorType,
                                                          String errorMessage,
                                                          Boolean isRepoPrivate) {
        return addAnalyticsForGitOperation(eventName, application, errorType, errorMessage, isRepoPrivate, false);
    }

    private Mono<Application> addAnalyticsForGitOperation(String eventName,
                                                          Application application,
                                                          String errorType,
                                                          String errorMessage,
                                                          Boolean isRepoPrivate,
                                                          Boolean isSystemGenerated) {
        GitApplicationMetadata gitData = application.getGitApplicationMetadata();
        Map<String, Object> analyticsProps = new HashMap<>();
        if (gitData != null) {
            analyticsProps.put(FieldName.APPLICATION_ID, gitData.getDefaultApplicationId());
            analyticsProps.put(FieldName.BRANCH_NAME, gitData.getBranchName());
            analyticsProps.put("gitHostingProvider", GitUtils.getGitProviderName(gitData.getRemoteUrl()));
        }
        // Do not include the error data points in the map for success states
        if(!StringUtils.isEmptyOrNull(errorMessage) || !StringUtils.isEmptyOrNull(errorType)) {
            analyticsProps.put("errorMessage", errorMessage);
            analyticsProps.put("errorType", errorType);
        }
        analyticsProps.putAll(Map.of(
                FieldName.ORGANIZATION_ID, defaultIfNull(application.getWorkspaceId(), ""),
                "branchApplicationId", defaultIfNull(application.getId(), ""),
                "isRepoPrivate", defaultIfNull(isRepoPrivate, ""),
                "isSystemGenerated", defaultIfNull(isSystemGenerated, "")
        ));
        return sessionUserService.getCurrentUser()
                .map(user -> {
                    analyticsService.sendEvent(eventName, user.getUsername(), analyticsProps);
                    return application;
                });
    }
}
