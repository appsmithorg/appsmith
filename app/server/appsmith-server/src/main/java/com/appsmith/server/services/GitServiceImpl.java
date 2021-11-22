package com.appsmith.server.services;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
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
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.SanitiseResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.constants.CommentConstants.APPSMITH_BOT_USERNAME;

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
    private final SanitiseResponse sanitiseResponse;
    private final EmailConfig emailConfig;

    private final static String DEFAULT_COMMIT_MESSAGE = "System generated commit, ";
    private final static String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    private final static String MERGE_CONFLICT_BRANCH_NAME = "_mergeConflict";
    private final static String CONFLICTED_SUCCESS_MESSAGE = "branch has been created from conflicted state. Please resolve merge conflicts in remote and pull again";

    private enum DEFAULT_COMMIT_REASONS {
        CONFLICT_STATE("for conflicted state"),
        CONNECT_FLOW(""),
        BRANCH_CREATED("after creating a new branch: "),
        SYNC_WITH_REMOTE_AFTER_PULL("for syncing changes with remote after git pull");

        private final String reason;
        DEFAULT_COMMIT_REASONS(String reason) {
            this.reason = reason;
        }
        private String getReason() {
            return this.reason;
        }
    }


    @Override
    public Mono<Application> updateGitMetadata(String applicationId, GitApplicationMetadata gitApplicationMetadata){

        if(Optional.ofNullable(gitApplicationMetadata).isEmpty()) {
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
                .map(sanitiseResponse::updateApplicationWithDefaultResources);
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
                        gitProfiles.put(FieldName.DEFAULT, userData.getDefaultOrAppSpecificGitProfiles(null));
                        gitProfiles.put(defaultApplicationId, userData.getDefaultOrAppSpecificGitProfiles(defaultApplicationId));
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
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, Boolean isDefault, String defaultApplicationId) {
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
                            GitProfile defaultProfile = userData.getDefaultOrAppSpecificGitProfiles(null);
                            /*
                             *  GitProfiles will be null if the user has not created any git profile.
                             *  If null or if the request is to save the profile as default then we need to create update
                             *  this field for the currentUser and save the profile data
                             *  Otherwise create a new entry or update existing entry
                             * */

                            if (gitProfile.equals(userGitProfile) || gitProfile.equals(defaultProfile)) {
                                return Mono.just(userData);
                            } else if (userGitProfile == null || Boolean.TRUE.equals(isDefault) || StringUtils.isEmptyOrNull(defaultApplicationId)) {
                                // Assign the default config
                                userData.setDefaultGitProfile(gitProfile);
                            } else {
                                userData.getGitProfiles().put(defaultApplicationId, gitProfile);
                            }
                            UserData requiredUpdates = new UserData();
                            requiredUpdates.setGitProfiles(userData.getGitProfiles());
                            return userDataService.updateForUser(user, userData);
                        })
                        .map(UserData::getGitProfiles)
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

    /**
     * This method will make a commit to local repo
     * @param commitDTO information required for making a commit
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
                .filter(userData -> !CollectionUtils.isNullOrEmpty(userData.getGitProfiles()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git author configuration for logged-in user. You can set up a git profile from the user profile section."))
                );

        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.BRANCH_NAME, branchName)))
            .flatMap(childApplication -> publishAndOrGetApplication(childApplication.getId(), commitDTO.getDoPush()))
            .flatMap(childApplication -> {
                GitApplicationMetadata gitApplicationMetadata = childApplication.getGitApplicationMetadata();
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
                            .exportApplicationById(childApplication.getId(), SerialiseApplicationObjective.VERSION_CONTROL),
                        Mono.just(childApplication)
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
                        // TODO clone the repo and then start the commit flow once again try this for 1 more time only
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", e));
                    }
                    return Mono.error(new AppsmithException(AppsmithError.IO_ERROR, e.getMessage()));
                }
            })
            .flatMap(tuple -> {
                Path baseRepoPath = tuple.getT1();
                Application childApplication = tuple.getT3();
                GitApplicationMetadata gitApplicationData = childApplication.getGitApplicationMetadata();
                GitProfile authorProfile =
                        tuple.getT2().getDefaultOrAppSpecificGitProfiles(gitApplicationData.getDefaultApplicationId());

                if (authorProfile == null) {
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
    public Mono<Application> connectApplicationToGit(String defaultApplicationId, GitConnectDTO gitConnectDTO, String originHeader) {
        /*
         *  Connecting the application for the first time
         *  The ssh keys is already present in application object from the generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        if(StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
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

        return updateOrCreateGitProfileForCurrentUser(
                gitConnectDTO.getGitProfile(), gitConnectDTO.isDefaultProfile(), defaultApplicationId)
                .then(getApplicationById(defaultApplicationId))
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    } else {
                        String repoName = getRepoName(gitConnectDTO.getRemoteUrl());
                        Path repoPath = Paths.get(application.getOrganizationId(), defaultApplicationId, repoName);
                        Mono<String> defaultBranch = gitExecutor.cloneApplication(
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
                                defaultBranch,
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
                                    if(!isEmpty) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_REPO));
                                    } else {
                                        GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                                        gitApplicationMetadata.setDefaultApplicationId(applicationId);
                                        gitApplicationMetadata.setBranchName(defaultBranch);
                                        gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitApplicationMetadata.setRepoName(repoName);
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
                    String repoName = getRepoName(gitConnectDTO.getRemoteUrl());
                    String defaultPageId = "";
                    if(!application.getPages().isEmpty()) {
                        defaultPageId = application.getPages()
                                .stream()
                                .filter(applicationPage -> applicationPage.getIsDefault().equals(Boolean.TRUE))
                                .collect(Collectors.toList())
                                .get(0)
                                .getId();
                    }
                    String viewModeUrl = Paths.get("/", application.getId(),
                            Entity.APPLICATIONS, Entity.PAGES, defaultPageId).toString();
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
                                    // Commit with default setting as app specific profile is not available at this point in time
                                    GitProfile profile = userData.getDefaultOrAppSpecificGitProfiles(null);
                                    return gitExecutor.commitApplication(tuple.getT1(), DEFAULT_COMMIT_MESSAGE, profile.getAuthorName(), profile.getAuthorEmail(), false);
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
                                                .map(isDeleted -> {
                                                    if(error instanceof TransportException) {
                                                        throw new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION);
                                                    }
                                                    throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage());
                                                })
                                    );
                                })
                                .thenReturn(sanitiseResponse.updateApplicationWithDefaultResources(application));
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                });
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
                                if(error instanceof TransportException) {
                                    return Mono.error( new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            "push",
                                            " Uh oh! you haven't provided the write permission to deploy keys. Appsmith needs write access to push to remote, please provide one to proceed"));
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage()));
                            });
                })
                .flatMap(pushResult -> {
                    if(pushResult.contains("REJECTED")) {
                        final String error = "Failed to push some refs to remote\n" +
                                "> To prevent you from losing history, non-fast-forward updates were rejected\n" +
                                "> Merge the remote changes (e.g. 'git pull') before pushing again.";
                        return Mono.error( new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " push", error));
                    }
                    return Mono.just(pushResult);
                });
    }

    /**
     * Disconnect from the git repo. This method will remove all the git metadata for the application
     * TODO Remove the files from the machine, since these files are stale
     * @param applicationId
     * @return Application data
     */
    @Override
    public Mono<Application> detachRemote(String applicationId) {
        return getApplicationById(applicationId)
                .flatMap(application -> {
                    if(Optional.ofNullable(application.getGitApplicationMetadata()).isEmpty()
                            || isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.just(application);
                    }
                    //Remove the git contents from file system
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    String repoName = gitApplicationMetadata.getRepoName();
                    Path repoPath = Paths.get(application.getOrganizationId(), gitApplicationMetadata.getDefaultApplicationId(), repoName);
                    application.setGitApplicationMetadata(null);
                    return fileUtils.detachRemote(repoPath)
                            .then(Mono.just(application));
                })
                .flatMap(applicationService::save)
                .map(sanitiseResponse::updateApplicationWithDefaultResources);
    }

    public Mono<Application> createBranch(String defaultApplicationId, GitBranchDTO branchDTO, String srcBranch) {

        /*
        1. Check if the src application is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the application from source application reference
         */

        if (StringUtils.isEmptyOrNull(srcBranch)) {
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
                                                .anyMatch(branch -> branch.getBranchName().replace("refs/remotes/origin/", "")
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
                .map(sanitiseResponse::updateApplicationWithDefaultResources);
    }

    public Mono<Application> checkoutBranch(String defaultApplicationId, String branchName, Boolean isRemote) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        //If the user is trying to check out remote branch, create a new branch if the branch does not exist already
        if(Boolean.TRUE.equals(isRemote)) {
            return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, READ_APPLICATIONS)
                    .onErrorResume(error -> checkoutRemoteBranch(defaultApplicationId, branchName));
        }

        return getApplicationById(defaultApplicationId)
            .flatMap(application -> {
                if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                    throw new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION);
                }
                return applicationService.findByBranchNameAndDefaultApplicationId(
                    branchName, defaultApplicationId, READ_APPLICATIONS
                );
            })
            .map(sanitiseResponse::updateApplicationWithDefaultResources);
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
                    * Use the creat branch method with isRemoteFlag or use the setStartPoint ,method in createBranch method
                    * */
                    Application srcApplication = tuple.getT2();

                    //Create a new Application
                    GitApplicationMetadata srcBranchGitData = srcApplication.getGitApplicationMetadata();
                    final String srcApplicationId = srcApplication.getId();
                    srcBranchGitData.setBranchName(branchName);
                    // Save a new application in DB and update from the parent branch application
                    srcBranchGitData.setGitAuth(null);
                    srcApplication.setId(null);
                    srcApplication.setPages(null);
                    srcApplication.setPublishedPages(null);
                    srcApplication.setGitApplicationMetadata(srcBranchGitData);

                    return applicationService.save(srcApplication)
                            .flatMap(application1 -> {
                                try {
                                    return fileUtils.reconstructApplicationFromGitRepo(srcApplication.getOrganizationId(), srcApplicationId, srcApplication.getGitApplicationMetadata().getRepoName(), branchName)
                                            .zipWith(Mono.just(application1));
                                } catch (GitAPIException | IOException e) {
                                    log.error("Error while constructing the application from the git repo ", e);
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, " checkout -t origin/"+branchName, e.getMessage()));
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
     * @param applicationId application for which we want to pull remote changes and merge
     * @param branchName remoteBranch from which the changes will be pulled and merged
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
                            checkIfRepoIsClean(branchedApplication.getId(), defaultGitMetadata.getDefaultApplicationId(), branchName, repoSuffix),
                            Mono.just(defaultGitMetadata.getGitAuth()),
                            Mono.just(branchedApplication)

                    );
                })
                .flatMap(tuple -> {
                    if (Boolean.FALSE.equals(tuple.getT2())) {
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
                                gitAuth.getPublicKey())
                                .onErrorResume(error -> {
                                    if (error.getMessage().contains("Nothing to fetch.")) {
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
        sanitiseResponse.updateApplicationWithDefaultResources(application);
        gitPullDTO.setMergeStatus(status);
        gitPullDTO.setApplication(application);
        return gitPullDTO;
    }

    private Mono<Boolean> checkIfRepoIsClean(String branchedApplicationId, String defaultApplicationId,String branchName, Path repoSuffix) {
        return importExportApplicationService.exportApplicationById(branchedApplicationId, SerialiseApplicationObjective.VERSION_CONTROL)
                .flatMap(applicationJson -> {
                    try {
                        return fileUtils.saveApplicationToLocalRepo(repoSuffix, applicationJson, branchName)
                                .flatMap(repoPath -> this.getStatus(defaultApplicationId, branchName)
                                        .map(status -> CollectionUtils.isNullOrEmpty(status.getModified())));
                    } catch (IOException e) {
                        log.error("Error while saving git files to repo {}. Details: {}", repoSuffix, e);
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    } catch (GitAPIException e) {
                        log.error("Error while git checkout to repo {}. Details: {}", repoSuffix, e);
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", e.getMessage()));
                    }
                });
    }

    @Override
    public Mono<List<GitBranchDTO>> listBranchForApplication(String defaultApplicationId, Boolean ignoreCache) {
        return getApplicationById(defaultApplicationId)
            .flatMap(application -> {
                GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                if (gitApplicationMetadata == null || gitApplicationMetadata.getDefaultApplicationId() == null) {
                    return Mono.error(new AppsmithException(
                            AppsmithError.INVALID_GIT_CONFIGURATION,
                            "Unable to find default application. Please configure the application with git"));
                }
                final String dbDefaultBranch = gitApplicationMetadata.getBranchName();
                Path repoPath = Paths.get(application.getOrganizationId(),
                        gitApplicationMetadata.getDefaultApplicationId(),
                        gitApplicationMetadata.getRepoName());

                // Fetch default branch from DB if the ignoreCache is false else fetch from remote
                return gitExecutor.listBranches(repoPath,
                        gitApplicationMetadata.getRemoteUrl(),
                        gitApplicationMetadata.getGitAuth().getPrivateKey(),
                        gitApplicationMetadata.getGitAuth().getPublicKey(),
                        ignoreCache)
                        .onErrorResume(error -> Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                "branch --list",
                                "Error while accessing the file system. Details :" + error.getMessage()))
                        )
                        .flatMap(gitBranchListDTOS -> {
                            if(Boolean.TRUE.equals(ignoreCache)) {
                                // delete local branches which are not present in remote repo
                                List<GitBranchDTO> remoteBranches = gitBranchListDTOS.stream()
                                        .filter(gitBranchListDTO -> gitBranchListDTO.getBranchName().contains("origin"))
                                        .collect(Collectors.toList());
                                List<GitBranchDTO> localBranch = gitBranchListDTOS.stream()
                                        .filter(gitBranchListDTO -> !gitBranchListDTO.getBranchName().contains("origin"))
                                        .collect(Collectors.toList());

                                for (GitBranchDTO branch: remoteBranches) {
                                    branch.setBranchName(branch.getBranchName().replace("origin/",""));
                                }

                                localBranch.removeAll(remoteBranches);

                                return Flux.fromIterable(localBranch)
                                        .flatMap(gitBranchListDTO -> applicationService.findByBranchNameAndDefaultApplicationId(gitBranchListDTO.getBranchName(), defaultApplicationId, MANAGE_APPLICATIONS)
                                                .flatMap(applicationPageService::deleteApplicationByResource))
                                        .then(Mono.just(gitBranchListDTOS));
                            } else {
                                return Mono.just(gitBranchListDTOS);
                            }
                        });
            });
    }

    /**
     * Get the status of the mentioned branch
     *
     * @param defaultApplicationId root/default application
     * @param branchName for which the status is required
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    public Mono<GitStatusDTO> getStatus(String defaultApplicationId, String branchName) {

        /*
            1. Copy resources from DB to local repo
            2. Fetch the current status from local repo
         */

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
                                Mono.just(gitData.getGitAuth())
                        );
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", e.getMessage()));
                    }
                })
                .flatMap(tuple -> gitExecutor.fetchRemote(tuple.getT1(), tuple.getT2().getPublicKey(), tuple.getT2().getPrivateKey(), true)
                        .then(gitExecutor.getStatus(tuple.getT1(), branchName))
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

        String sourceBranch = gitMergeDTO.getSourceBranch();
        String destinationBranch = gitMergeDTO.getDestinationBranch();

        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoPath = Paths.get(application.getOrganizationId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());

                    //1. Hydrate from db to file system for both branch Applications
                    Mono<Path> pathToFile = getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, sourceBranch, repoPath)
                            .flatMap(path -> getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, destinationBranch, repoPath));

                    return Mono.zip(
                            Mono.just(application),
                            pathToFile
                    ).onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)));
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    Path repoPath = tuple.getT2();

                    //2. git checkout destinationBranch ---> git merge sourceBranch
                    return Mono.zip(gitExecutor.mergeBranch(repoPath, sourceBranch, destinationBranch), Mono.just(application))
                    // On merge conflict create a new branch and push the branch to remote. Let the user resolve it the git client like github/gitlab handleMergeConflict
                    .onErrorResume(error -> {
                        if(error.getMessage().contains("Merge conflict")) {
                            return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "Merge", error.getMessage()));
                        }
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "Merge", error.getMessage()));
                    });
                })
                .flatMap(mergeStatusTuple -> {
                    Application application = mergeStatusTuple.getT2();
                    String mergeStatus = mergeStatusTuple.getT1();

                    //3. rehydrate from file system to db
                    try {
                        Mono<ApplicationJson> applicationJson = fileUtils.reconstructApplicationFromGitRepo(
                                application.getOrganizationId(),
                                application.getGitApplicationMetadata().getDefaultApplicationId(),
                                application.getGitApplicationMetadata().getRepoName(),
                                destinationBranch);
                        return Mono.zip(Mono.just(mergeStatus), Mono.just(application), applicationJson);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "merge", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT2();
                    ApplicationJson applicationJson = tuple.getT3();
                    MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
                    mergeStatusDTO.setStatus(tuple.getT1());
                    mergeStatusDTO.setMergeAble(Boolean.TRUE);

                    //4. Get the latest application mono with all the changes
                    return importExportApplicationService
                            .importApplicationInOrganization(application.getOrganizationId(), applicationJson, application.getId(), destinationBranch)
                            .map(application1 -> getPullDTO(application1, mergeStatusDTO));
                });
    }

    @Override
    public Mono<MergeStatusDTO> isBranchMergeable(String defaultApplicationId, String sourceBranch, String destinationBranch) {
        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoPath = Paths.get(application.getOrganizationId(),
                            gitApplicationMetadata.getDefaultApplicationId(),
                            gitApplicationMetadata.getRepoName());

                    //1. Hydrate from db to file system for both branch Applications
                    return getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, sourceBranch, repoPath)
                            .flatMap(path -> getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, destinationBranch, repoPath))
                            .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "merge status", error.getMessage())));
                })
                .flatMap(repoPath -> gitExecutor.isMergeBranch(repoPath, sourceBranch, destinationBranch));
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

    private Mono<Path> getBranchApplicationFromDBAndSaveToLocalFileSystem(String defaultApplicationId, String branchName, Path repoPath) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                .flatMap(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), SerialiseApplicationObjective.VERSION_CONTROL))
                .flatMap(applicationJson -> {
                    try {
                        return fileUtils.saveApplicationToLocalRepo(repoPath, applicationJson, branchName);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, e.getMessage()));
                    }
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
                            if(pushResult.contains("REJECTED")) {
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
