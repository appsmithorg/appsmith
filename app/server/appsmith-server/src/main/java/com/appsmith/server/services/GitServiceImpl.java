package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.GitDeployApplicationResultDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.AppsmithRoleUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.ce.GitAutoCommitHelper;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce_compatible.GitServiceCECompatibleImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.AnalyticsEvents.GIT_UPDATE_DEFAULT_BRANCH;
import static com.appsmith.external.constants.GitConstants.ERROR_AUTO_DEPLOYMENT_NOT_CONFIGURED;
import static com.appsmith.external.constants.GitConstants.GIT_CONFIG_ERROR;
import static com.appsmith.server.acl.AppsmithRole.GIT_WEB_HOOK_EXECUTOR;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_GIT_CONFIGURATION;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class GitServiceImpl extends GitServiceCECompatibleImpl implements GitService {
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final RoleConfigurationSolution roleConfigurationSolution;
    private final ApiKeyService apiKeyService;
    private final PolicyGenerator policyGenerator;

    public GitServiceImpl(
            UserService userService,
            UserDataService userDataService,
            SessionUserService sessionUserService,
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            GitFileUtils fileUtils,
            ImportService importService,
            ExportService exportService,
            GitExecutor gitExecutor,
            ResponseUtils responseUtils,
            EmailConfig emailConfig,
            AnalyticsService analyticsService,
            GitDeployKeysRepository gitDeployKeysRepository,
            DatasourceService datasourceService,
            PluginService pluginService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            WorkspacePermission workspacePermission,
            WorkspaceService workspaceService,
            RedisUtils redisUtils,
            ObservationRegistry observationRegistry,
            GitPrivateRepoHelper gitPrivateRepoHelper,
            TransactionalOperator transactionalOperator,
            GitAutoCommitHelper gitAutoCommitHelper,
            PermissionGroupRepository permissionGroupRepository,
            TenantService tenantService,
            UserRepository userRepository,
            RoleConfigurationSolution roleConfigurationSolution,
            ApiKeyService apiKeyService,
            PolicyGenerator policyGenerator) {
        super(
                userService,
                userDataService,
                sessionUserService,
                applicationService,
                applicationPageService,
                newPageService,
                newActionService,
                actionCollectionService,
                fileUtils,
                importService,
                exportService,
                gitExecutor,
                responseUtils,
                emailConfig,
                analyticsService,
                gitDeployKeysRepository,
                datasourceService,
                pluginService,
                datasourcePermission,
                applicationPermission,
                workspacePermission,
                workspaceService,
                redisUtils,
                observationRegistry,
                gitPrivateRepoHelper,
                transactionalOperator,
                gitAutoCommitHelper);
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
        this.sessionUserService = sessionUserService;
        this.analyticsService = analyticsService;
        this.permissionGroupRepository = permissionGroupRepository;
        this.tenantService = tenantService;
        this.userRepository = userRepository;
        this.roleConfigurationSolution = roleConfigurationSolution;
        this.apiKeyService = apiKeyService;
        this.policyGenerator = policyGenerator;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_branch_protection_enabled)
    public Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName) {
        if (!StringUtils.hasLength(newDefaultBranchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }
        // get the application in default branch
        return applicationService
                .findByBranchNameAndDefaultApplicationId(
                        newDefaultBranchName,
                        defaultApplicationId,
                        applicationPermission.getManageDefaultBranchPermission())
                .flatMap(defaultBranchedApplication -> {
                    if (defaultBranchedApplication.getGitApplicationMetadata() == null) {
                        // application not connected to Git, throw error
                        return Mono.error(new AppsmithException(INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }
                    // fetch all applications that has gitApplicationMetadata.defaultApplication=defaultApplicationId
                    return applicationService
                            .findAllApplicationsByDefaultApplicationId(
                                    defaultApplicationId, applicationPermission.getEditPermission())
                            .flatMap(application -> {
                                // update the application with the new default branch name
                                application.getGitApplicationMetadata().setDefaultBranchName(newDefaultBranchName);
                                return applicationService.save(application);
                            })
                            .then()
                            .thenReturn(defaultBranchedApplication);
                })
                .flatMap(defaultBranchedApplication -> {
                    // all applications in DB have new default branch set but this rootApplication still have old one
                    // as it was fetched before the update. we need this object to send analytics event
                    String oldDefaultBranch = defaultBranchedApplication
                            .getGitApplicationMetadata()
                            .getDefaultBranchName();

                    Map<String, Object> map = Map.of(
                            "old_branch", oldDefaultBranch,
                            "new_branch", newDefaultBranchName);
                    return sendGitAnalyticsEvent(GIT_UPDATE_DEFAULT_BRANCH, defaultBranchedApplication, map)
                            .thenReturn(newDefaultBranchName);
                })
                .thenReturn(newDefaultBranchName);
    }

    /**
     * This method is overridden from CE. In CE, the default branch is automatically synced from the remote.
     * In EE, we'll not sync the remote branch automatically because the user might have set the default branch to
     * something else other than the remote branch.
     *
     * @param defaultApplicationId ID of the default application
     * @param pruneBranches        Boolean to indicate whether to fetch the branch names from remote
     * @param currentBranch        Name of the current branch
     * @return Mono of the default branch name
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_branch_protection_enabled)
    public Mono<List<GitBranchDTO>> listBranchForApplication(
            String defaultApplicationId, Boolean pruneBranches, String currentBranch) {
        return getBranchList(defaultApplicationId, pruneBranches, currentBranch, false);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_branch_protection_enabled)
    public Mono<List<String>> updateProtectedBranches(String defaultApplicationId, List<String> branchNames) {
        return getApplicationById(defaultApplicationId, applicationPermission.getManageProtectedBranchPermission())
                .flatMap(rootApplication -> {
                    GitArtifactMetadata metadata = rootApplication.getGitApplicationMetadata();
                    // keep a copy of old protected branches as it's required to send analytics event later
                    List<String> oldProtectedBranches = metadata.getBranchProtectionRules() != null
                            ? metadata.getBranchProtectionRules()
                            : List.of();
                    metadata.setBranchProtectionRules(branchNames);
                    return applicationService
                            .save(rootApplication)
                            .then(applicationService.updateProtectedBranches(defaultApplicationId, branchNames))
                            .then(sendBranchProtectionAnalytics(rootApplication, oldProtectedBranches, branchNames))
                            .thenReturn(branchNames);
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_branch_protection_enabled)
    public Mono<List<String>> getProtectedBranches(String defaultApplicationId) {
        return getApplicationById(defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    GitArtifactMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    return Mono.justOrEmpty(gitApplicationMetadata.getBranchProtectionRules());
                })
                .defaultIfEmpty(List.of());
    }

    /**
     * This method is responsible to do the following:
     * 1. Create a bot user for this default application is does not exist
     * 2. Create a permission group for this bot user and application if does not exist
     * 3. Add the permission group to the policies of all applications under this git connected app
     * 4. Invalidate all the previously generated API keys
     * 5. Generate a new API key for this bot user
     * @param defaultApplicationId ID of the default application
     * @return The generated key
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_continuous_delivery_enabled)
    public Mono<String> generateBearerTokenForApplication(String defaultApplicationId) {
        // get all the branched applications, we'll need this later
        Flux<Application> branchedApplications = applicationService
                .findAllApplicationsByDefaultApplicationId(
                        defaultApplicationId, applicationPermission.getEditPermission())
                .cache();

        Mono<Application> rootAppMono = branchedApplications
                .filter(application -> defaultApplicationId.equals(application.getId()))
                .single() // using single because exactly one item should emit and will throw if no item or multiple
                // found
                .cache();

        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();

        // Create Git bot user
        Mono<User> gitBotUserMono = Mono.zip(rootAppMono, defaultTenantIdMono)
                .flatMap(pair -> {
                    Application application = pair.getT1();
                    String tenantId = pair.getT2();
                    return getOrCreateGitBotUser(application, tenantId);
                })
                .cache();

        // Create Role
        Mono<PermissionGroup> gitBotRoleMono = Mono.zip(rootAppMono, gitBotUserMono)
                .flatMap(pair -> {
                    Application application = pair.getT1();
                    User botUser = pair.getT2();
                    return getOrCreateGitBotRole(application, botUser);
                });

        // Associate role with related resources.
        Mono<Void> associateApplicationAndRelatedResourcesWithGitRoleFlux = Mono.zip(
                        branchedApplications.collectList(), gitBotRoleMono)
                .flatMap(pair -> {
                    List<Application> applications = pair.getT1();
                    PermissionGroup permissionGroup = pair.getT2();
                    List<Mono<Long>> assignRolesToAppsMonos = new ArrayList<>();
                    for (Application application : applications) {
                        assignRolesToAppsMonos.add(assignGitBotRoleToAllBranchedApplications(
                                application.getId(), permissionGroup.getId()));
                    }
                    return Flux.merge(assignRolesToAppsMonos).then();
                });

        // Generate API Key for the User
        Mono<String> generateApiKeyForGitBotUser = gitBotUserMono.flatMap(gitBotUser -> {
            ApiKeyRequestDto apiKeyRequestDto =
                    ApiKeyRequestDto.builder().email(gitBotUser.getUsername()).build();
            // Note: generating and archiving the api keys without permission check, because we are fetching
            // the Application using Edit permission.
            // GenerateApiKey & ArchiveAllApiKeysForUser uses Instance Admin role in order to archive keys.
            return apiKeyService
                    .archiveAllApiKeysForUserWithoutPermissionCheck(gitBotUser.getUsername())
                    .then(apiKeyService.generateApiKeyWithoutPermissionCheck(apiKeyRequestDto));
        });

        return associateApplicationAndRelatedResourcesWithGitRoleFlux.then(generateApiKeyForGitBotUser);
    }

    /**
     * We already have a service method GitService.discardChanges that does the following:
     * 1. Discard any uncommitted local changes in Git
     * 2. Pull from remote
     * 3. Publish the application
     * In this webhook, we'll trigger the existing discardChanges method.
     * It'll also change the response to a different format so that it's meaningful to the entity that
     * triggered this webhook.
     * @param defaultApplicationId ID of the default application
     * @param branchName Name of the branch
     * @return A response DTO with some Metadata regarding this action.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_continuous_delivery_enabled)
    public Mono<GitDeployApplicationResultDTO> autoDeployGitApplication(
            String defaultApplicationId, String branchName) {
        return getApplicationById(defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    GitArtifactMetadata metadata = application.getGitApplicationMetadata();
                    if (metadata == null || !metadata.isAutoDeploymentEnabled()) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, ERROR_AUTO_DEPLOYMENT_NOT_CONFIGURED));
                    }
                    // return the application for the target branch
                    return applicationService.findByBranchNameAndDefaultApplicationId(
                            branchName, defaultApplicationId, applicationPermission.getEditPermission());
                })
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.APPLICATION,
                        defaultApplicationId + "," + branchName)))
                .then(discardChanges(defaultApplicationId, branchName))
                .flatMap(application -> sendGitAnalyticsEvent(
                                AnalyticsEvents.GIT_PULL, application, Map.of("viaCD", Boolean.TRUE))
                        .thenReturn(application))
                .map(application -> {
                    GitDeployApplicationResultDTO resultDTO = new GitDeployApplicationResultDTO();
                    resultDTO.setApplicationId(defaultApplicationId);
                    resultDTO.setBranchName(branchName);
                    resultDTO.setApplicationName(application.getName());
                    resultDTO.setDeployedAt(Instant.now());
                    resultDTO.setRepoUrl(application.getGitApplicationMetadata().getRemoteUrl());
                    return resultDTO;
                });
    }

    private Mono<PermissionGroup> getOrCreateGitBotRole(Application application, User user) {
        PermissionGroup gitBotRole = new PermissionGroup();
        gitBotRole.setName(GitUtils.generateGitBotRoleName(application));
        gitBotRole.setDefaultDomainType(Application.class.getSimpleName());
        gitBotRole.setDefaultDomainId(application.getId());
        gitBotRole.setDescription(GIT_WEB_HOOK_EXECUTOR.getDescription());
        gitBotRole.setAssignedToUserIds(Set.of(user.getId()));

        return getGitBotRole(application).switchIfEmpty(Mono.defer(() -> permissionGroupRepository.save(gitBotRole)));
    }

    private Mono<PermissionGroup> getGitBotRole(Application application) {
        return permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(application.getId(), Application.class.getSimpleName())
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.GIT_WEB_HOOK_EXECUTOR))
                .next(); // using next so that it'll return a single item or empty. if empty, we need to create
    }

    private Mono<User> getOrCreateGitBotUser(Application application, String tenantId) {
        String userEmail = GitUtils.generateGitBotUserEmail(application.getId());
        String userName = GitUtils.generateGitBotUserName(application.getId());
        User user = new User();
        user.setEmail(userEmail);
        user.setName(userName);
        user.setTenantId(tenantId);
        user.setIsSystemGenerated(Boolean.TRUE);
        return getApplicationBotUser(application, tenantId).switchIfEmpty(Mono.defer(() -> userRepository.save(user)));
    }

    private Mono<User> getApplicationBotUser(Application application, String tenantId) {
        String userEmail = GitUtils.generateGitBotUserEmail(application.getId());
        return userRepository.findByEmailAndTenantId(userEmail, tenantId);
    }

    private Mono<Long> assignGitBotRoleToAllBranchedApplications(String applicationId, String permissionGroupId) {
        Map<String, List<AclPermission>> permissionListMapForGitWebhookExecutorRole =
                AppsmithRoleUtils.getPermissionListMapForRole(
                        List.of(Application.class, Workspace.class, Module.class, Package.class),
                        GIT_WEB_HOOK_EXECUTOR);

        return roleConfigurationSolution.updateApplicationAndRelatedResourcesWithPermissionsForRole(
                applicationId, permissionGroupId, permissionListMapForGitWebhookExecutorRole, Map.of());
    }

    /**
     * In order to enable or disable the auto deployment, user need to preconfigure this.
     * This method is used to enable or disable the option for the application.
     * @param defaultApplicationId ID of the default application
     * @return Boolean true if enabled after this operation, false otherwise.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_continuous_delivery_enabled)
    public Mono<Boolean> toggleAutoDeploymentSettings(String defaultApplicationId) {
        // try to find whether the target branch is already checked out, otherwise return error
        return getApplicationById(defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    GitArtifactMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    // toggle the auto deployment flag
                    if (gitApplicationMetadata.isAutoDeploymentEnabled()) {
                        gitApplicationMetadata.setAutoDeploymentEnabled(false);
                    } else {
                        gitApplicationMetadata.setAutoDeploymentEnabled(true);
                    }

                    return applicationService
                            .save(application)
                            .flatMap(savedApplication -> {
                                // send the analytics event
                                if (!gitApplicationMetadata.isAutoDeploymentEnabled()) {
                                    return sendGitAnalyticsEvent(
                                            AnalyticsEvents.GIT_CD_DISABLED, savedApplication, null);
                                } else {
                                    return Mono.empty();
                                }
                            })
                            .thenReturn(gitApplicationMetadata.isAutoDeploymentEnabled());
                });
    }

    /**
     * Generic method to send analytics for git operations.
     * @param analyticsEvents Name of the event
     * @param application Application object
     * @param extraProps Extra properties that need to be passed along with default ones.
     * @return A void mono
     */
    protected Mono<Void> sendGitAnalyticsEvent(
            AnalyticsEvents analyticsEvents, Application application, Map<String, Object> extraProps) {
        GitArtifactMetadata gitData = application.getGitApplicationMetadata();
        Map<String, Object> analyticsProps = new HashMap<>();
        analyticsProps.put("appId", gitData.getDefaultApplicationId());
        analyticsProps.put("orgId", application.getWorkspaceId());
        analyticsProps.put(FieldName.GIT_HOSTING_PROVIDER, GitUtils.getGitProviderName(gitData.getRemoteUrl()));
        analyticsProps.put(FieldName.REPO_URL, gitData.getRemoteUrl());

        if (extraProps != null) {
            analyticsProps.putAll(extraProps);
        }

        return sessionUserService
                .getCurrentUser()
                .flatMap(user ->
                        analyticsService.sendEvent(analyticsEvents.getEventName(), user.getUsername(), analyticsProps));
    }
}
