package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchListDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.MergeStatus;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.Entity;
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
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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

    private final static String DEFAULT_COMMIT_MESSAGE = "Appsmith default generated commit";
    private final static String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    private final static String MERGE_CONFLICT_BRANCH_NAME = "_mergeConflict";


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
    public Mono<String> commitApplication(GitCommitDTO commitDTO, String defaultApplicationId, MultiValueMap<String, String> params) {

        /*
        1. Check if application exists and user have sufficient permissions
        2. Check if branch name exists in git metadata
        3. Save application to the existing local repo
        4. Commit application : git add, git commit (Also check if git init required)
         */
        String branchName = params.getFirst(FieldName.BRANCH_NAME);
        String commitMessage = commitDTO.getCommitMessage();
        StringBuilder result = new StringBuilder();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE);
        }
        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        Mono<UserData> currentUserMono = userDataService.getForCurrentUser()
                .filter(userData -> !CollectionUtils.isNullOrEmpty(userData.getGitProfiles()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Unable to find git author configuration for logged-in user. You can set up a git profile from the user profile section."))
                );

        return applicationService.getApplicationByBranchNameAndDefaultApplication(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
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
                        gitExecutor.commitApplication(baseRepoPath, commitMessage, authorProfile.getAuthorName(), authorProfile.getAuthorEmail())
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
                    result.append(". Push Result : ");
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
    public Mono<List<GitLogDTO>> getCommitHistory(String defaultApplicationId, MultiValueMap<String, String> params) {

        String branchName = params.getFirst(FieldName.BRANCH_NAME);

        return applicationService.getApplicationByBranchNameAndDefaultApplication(branchName, defaultApplicationId, READ_APPLICATIONS)
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
                                return Mono.error(new AppsmithException(AppsmithError.AUTHENTICATION_FAILURE, "SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key"));
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
                    try {
                        return fileUtils.checkIfDirectoryIsEmpty(repoPath)
                                .flatMap(isEmpty -> {
                                    if(!isEmpty) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_REPO));
                                    } else {
                                        GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                                        gitApplicationMetadata.setDefaultApplicationId(application.getId());
                                        gitApplicationMetadata.setBranchName(defaultBranch);
                                        gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitApplicationMetadata.setRepoName(repoName);
                                        application.setGitApplicationMetadata(gitApplicationMetadata);
                                        return applicationService.save(application);
                                    }
                                });
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
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
                    } else {
                        // TODO either throw error message saying invalid application or have a default value
                        defaultPageId = "defaultPage";
                    }
                    String viewModeUrl = Paths.get("/", application.getId(),
                            Entity.APPLICATIONS, Entity.PAGES, defaultPageId).toString();
                    String editModeUrl = Paths.get(viewModeUrl, "edit").toString();
                    //Initialize the repo with readme file
                    try {
                        fileUtils.initializeGitRepo(
                                Paths.get(application.getOrganizationId(), defaultApplicationId, repoName, "README.md"),
                                originHeader + viewModeUrl,
                                originHeader + editModeUrl
                        );
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }
                    return Mono.just(application);
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
    public Mono<String> pushApplication(String defaultApplicationId, MultiValueMap<String, String> params) {
        String branchName = params.getFirst(FieldName.BRANCH_NAME);
        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }
        return applicationService.getChildApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
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
                            .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage())));
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
                .flatMap(application -> applicationService.save(application));
    }

    public Mono<Application> createBranch(String defaultApplicationId, GitBranchDTO branchDTO, MultiValueMap<String, String> params) {

        /*
        1. Check if the src application is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the application from source application reference
         */

        final String srcBranch = params.getFirst(FieldName.BRANCH_NAME);
        if (StringUtils.isEmptyOrNull(srcBranch)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        return applicationService.getApplicationByBranchNameAndDefaultApplication(srcBranch, defaultApplicationId, MANAGE_APPLICATIONS)
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
                    return Mono.zip(
                            gitExecutor.checkoutToBranch(repoSuffix, srcBranch)
                                    .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", "Unable to find " + srcBranch))),
                            gitExecutor.fetchRemote(repoSuffix, defaultGitAuth.getPublicKey(), defaultGitAuth.getPrivateKey(), false))
                            .flatMap(ignore -> gitExecutor.listBranches(repoSuffix, ListBranchCommand.ListMode.REMOTE, srcBranchGitData.getRemoteUrl(), defaultGitAuth.getPublicKey(), defaultGitAuth.getPrivateKey())
                                    .flatMap(branchList -> {
                                        boolean isDuplicateName = branchList.stream()
                                                // TODO We are only supporting origin as the remote name so this is safe
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
                            savedApplication.getId()
                    );
                });
    }

    public Mono<Application> checkoutBranch(String defaultApplicationId, String branchName) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }
        return getApplicationById(defaultApplicationId)
            .flatMap(application -> {
                if (isInvalidDefaultApplicationGitMetadata(application.getGitApplicationMetadata())) {
                    throw new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION);
                }
                return applicationService.getApplicationByBranchNameAndDefaultApplication(
                    branchName, defaultApplicationId, READ_APPLICATIONS
                );
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
     * @param defaultApplicationId application for which we want to pull remote changes and merge
     * @param branchName remoteBranch from which the changes will be pulled and merged
     * @return return the status of pull operation
     */
    @Override
    public Mono<GitPullDTO> pullApplication(String defaultApplicationId, String branchName) {
        /*
         * 1.Dehydrate the application from Mongodb so that the file system has latest application data
         * 2.Do git pull after the rehydration and merge the remote changes to the current branch
         *   On Merge conflict - create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to mongodb so that the latest changes from remote are rendered to the application
         * 4.Get the latest application mono from the mongodb and send it back to client
         * */

        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    /*
                    * There are two cases. If the branchName is defaultBranch, defaultApplication will be used
                    * Else, get the Application object for the given branchName
                    * */
                    if (application.getGitApplicationMetadata().getBranchName().equals(branchName)) {
                        return Mono.zip(
                                Mono.just(application),
                                importExportApplicationService.exportApplicationById(defaultApplicationId, SerialiseApplicationObjective.VERSION_CONTROL),
                                Mono.just(application.getGitApplicationMetadata())
                        );
                    } else {
                        return applicationService.getApplicationByBranchNameAndDefaultApplication(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                                .flatMap(application1 -> Mono.zip(
                                        Mono.just(application1),
                                        importExportApplicationService.exportApplicationById(application1.getId(), SerialiseApplicationObjective.VERSION_CONTROL),
                                        Mono.just(application.getGitApplicationMetadata()))
                                );
                    }
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    ApplicationJson applicationJson = tuple.getT2();

                    GitApplicationMetadata gitApplicationMetadata = tuple.getT3();

                    Path repoPath = Paths.get(application.getOrganizationId(),
                            defaultApplicationId,
                            gitApplicationMetadata.getRepoName());

                    // 1. Dehydrate application from db and save to repo after the branch checkout
                    try {
                        return Mono.zip(
                                fileUtils.saveApplicationToLocalRepo(repoPath, applicationJson, branchName),
                                Mono.just(application),
                                Mono.just(gitApplicationMetadata.getGitAuth()));
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Path repoPath = tuple.getT1();
                    Application application = tuple.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    GitAuth gitAuth = tuple.getT3();

                    // 2. git pull origin branchName
                    Mono<String> pullStatus = gitExecutor.pullApplication(
                            repoPath,
                            gitApplicationMetadata.getRemoteUrl(),
                            gitApplicationMetadata.getBranchName(),
                            gitAuth.getPrivateKey(),
                            gitAuth.getPublicKey())
                            .onErrorResume(error -> {
                                if (error.getMessage().contains("Nothing to fetch.")) {
                                    return Mono.just("Nothing to fetch from remote. All changes are upto date.");
                                } else if(error.getMessage().contains("Merge conflict")) {
                                    // On merge conflict create a new branch and push the branch to remote. Let the user resolve it the git client like github/gitlab
                                    MultiValueMap<String, String> valueMap = new LinkedMultiValueMap<>();
                                    valueMap.add(FieldName.BRANCH_NAME, branchName);
                                    return handleMergeConflict(defaultApplicationId, valueMap)
                                            .flatMap(status -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull",error.getMessage() )));
                                } else {
                                    throw new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", error.getMessage());
                                }
                            });

                    //3. Hydrate from file system to db
                    try {
                        Mono<ApplicationJson> applicationJson = fileUtils.reconstructApplicationFromGitRepo(
                                application.getOrganizationId(),
                                defaultApplicationId,
                                application.getGitApplicationMetadata().getRepoName(),
                                branchName);
                        return Mono.zip(pullStatus, Mono.just(application), applicationJson);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT2();
                    ApplicationJson applicationJson = tuple.getT3();
                    String status = tuple.getT1();

                    //4. Get the latest application mono with all the changes
                    return importExportApplicationService
                            .importApplicationInOrganization(application.getOrganizationId(), applicationJson, application.getId())
                            .map(application1 -> setStatusAndApplication(application1, status));
                });
    }

    private GitPullDTO setStatusAndApplication(Application application, String status) {
        GitPullDTO gitPullDTO = new GitPullDTO();
        gitPullDTO.setPullStatus(status);
        gitPullDTO.setApplication(application);
        return gitPullDTO;
    }

    @Override
    public Mono<List<GitBranchListDTO>> listBranchForApplication(String defaultApplicationId) {
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

                return gitExecutor.listBranches(repoPath,
                        null,
                        gitApplicationMetadata.getRemoteUrl(),
                        gitApplicationMetadata.getGitAuth().getPrivateKey(),
                        gitApplicationMetadata.getGitAuth().getPublicKey())
                        .onErrorResume(error -> Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                "branch --list",
                                "Error while accessing the file system. Details :" + error.getMessage()))
                        );
            });
    }

    /**
     * Get the status of the mentioned branch
     *
     * @param defaultApplicationId root/default application
     * @param params contains the branch name
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    public Mono<Map<String, Object>> getStatus(String defaultApplicationId, MultiValueMap<String, String> params) {

        /*
            1. Copy resources from DB to local repo
            2. Fetch the current status from local repo
         */
        String branchName = params.getFirst(FieldName.BRANCH_NAME);
        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        return Mono.zip(
                getGitApplicationMetadata(defaultApplicationId),
                applicationService.getApplicationByBranchNameAndDefaultApplication(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
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
    public Mono<GitPullDTO> mergeBranch(String defaultApplicationId, String sourceBranch, String destinationBranch) {
        /*
         * 1.Dehydrate the application from Mongodb so that the file system has latest application data for both the source and destination branch application
         * 2.Do git checkout destinationBranch ---> git merge sourceBranch after the rehydration
         *   On Merge conflict - create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to mongodb so that the latest changes from remote are rendered to the application
         * 4.Get the latest application mono from the mongodb and send it back to client
         * */

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
                    Mono<Path> pathToFile = getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, sourceBranch, sourceBranch, repoPath)
                            .flatMap(path -> getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, sourceBranch, destinationBranch, repoPath));

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
                            MultiValueMap<String, String> valueMap = new LinkedMultiValueMap<>();
                            valueMap.add(FieldName.BRANCH_NAME, destinationBranch);
                            return handleMergeConflict(defaultApplicationId, valueMap)
                                    .flatMap(status -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "merge",error.getMessage() )));
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
                    String status = tuple.getT1();

                    //4. Get the latest application mono with all the changes
                    return importExportApplicationService
                            .importApplicationInOrganization(application.getOrganizationId(), applicationJson, application.getId())
                            .map(application1 -> setStatusAndApplication(application1, status));
                });
    }

    @Override
    public Mono<MergeStatus> isBranchMergeable(String defaultApplicationId, String sourceBranch, String destinationBranch) {
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
                    return getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, sourceBranch, sourceBranch, repoPath)
                            .flatMap(path -> getBranchApplicationFromDBAndSaveToLocalFileSystem(defaultApplicationId, sourceBranch, destinationBranch, repoPath))
                            .onErrorResume(error -> Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "merge status", error.getMessage())));
                })
                .flatMap(repoPath -> gitExecutor.isMergeBranch(repoPath, sourceBranch, destinationBranch));
    }

    private Mono<Path> getBranchApplicationFromDBAndSaveToLocalFileSystem(String defaultApplicationId, String sourceBranch, String destinationBranch, Path repoPath) {
        return applicationService.getApplicationByBranchNameAndDefaultApplication(destinationBranch, defaultApplicationId, MANAGE_APPLICATIONS)
                .flatMap(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), SerialiseApplicationObjective.VERSION_CONTROL))
                .flatMap(applicationJson -> {
                    try {
                        return fileUtils.saveApplicationToLocalRepo(repoPath, applicationJson, sourceBranch);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, e.getMessage()));
                    }
                });
    }

    private Mono<String> handleMergeConflict(String defaultApplicationId, MultiValueMap<String, String> branchName) {
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName(branchName + MERGE_CONFLICT_BRANCH_NAME);

        return createBranch(defaultApplicationId, gitBranchDTO, branchName)
                .flatMap(application -> {
                    GitCommitDTO gitCommitDTO = new GitCommitDTO();
                    gitCommitDTO.setDoPush(true);
                    gitCommitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE);
                    // TODO delete the branches created as part of conflicts handling
                    return commitApplication(gitCommitDTO, defaultApplicationId, branchName)
                            .flatMap(status -> pushApplication(defaultApplicationId, true));
                });
    }

    private boolean isInvalidDefaultApplicationGitMetadata(GitApplicationMetadata gitApplicationMetadata) {
        return Optional.ofNullable(gitApplicationMetadata).isEmpty()
                || Optional.ofNullable(gitApplicationMetadata.getGitAuth()).isEmpty()
                || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPrivateKey())
                || StringUtils.isEmptyOrNull(gitApplicationMetadata.getGitAuth().getPublicKey());
    }
}
