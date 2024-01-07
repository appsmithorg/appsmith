package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.ce.GitAutoCommitHelper;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.ce_compatible.GitServiceCECompatibleImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.AnalyticsEvents.GIT_UPDATE_DEFAULT_BRANCH;
import static com.appsmith.external.constants.GitConstants.GIT_CONFIG_ERROR;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_GIT_CONFIGURATION;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class GitServiceImpl extends GitServiceCECompatibleImpl implements GitService {
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final WorkspacePermission workspacePermission;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;

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
            ImportApplicationService importApplicationService,
            ExportApplicationService exportApplicationService,
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
            GitAutoCommitHelper gitAutoCommitHelper) {
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
                importApplicationService,
                exportApplicationService,
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
        this.workspacePermission = workspacePermission;
        this.sessionUserService = sessionUserService;
        this.analyticsService = analyticsService;
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
                        newDefaultBranchName, defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(defaultBranchedApplication -> checkPermissionOnWorkspace(
                                defaultBranchedApplication.getWorkspaceId(),
                                workspacePermission.getApplicationCreatePermission(),
                                "Change default branch")
                        .thenReturn(defaultBranchedApplication))
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

                    return sendAnalyticsForDefaultBranch(
                                    defaultBranchedApplication, oldDefaultBranch, newDefaultBranchName)
                            .thenReturn(newDefaultBranchName);
                })
                .thenReturn(newDefaultBranchName);
    }

    /**
     * This method is overridden from CE. In CE, the default branch is automatically synced from the remote.
     * In EE, we'll not sync the remote branch automatically because the user might have set the default branch to
     * something else other than the remote branch.
     * @param defaultApplicationId ID of the default application
     * @param pruneBranches Boolean to indicate whether to fetch the branch names from remote
     * @param currentBranch Name of the current branch
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
        return getApplicationById(defaultApplicationId).flatMap(rootApplication -> {
            GitApplicationMetadata metadata = rootApplication.getGitApplicationMetadata();

            // keep a copy of old protected branches as it's required to send analytics event later
            List<String> oldProtectedBranches =
                    metadata.getBranchProtectionRules() != null ? metadata.getBranchProtectionRules() : List.of();

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
        return getApplicationById(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    return Mono.justOrEmpty(gitApplicationMetadata.getBranchProtectionRules());
                })
                .defaultIfEmpty(List.of());
    }

    private Mono<Void> sendAnalyticsForDefaultBranch(
            Application application, String oldDefaultBranch, String newDefaultBranch) {
        GitApplicationMetadata gitData = application.getGitApplicationMetadata();
        Map<String, Object> analyticsProps = new HashMap<>();
        analyticsProps.put("appId", gitData.getDefaultApplicationId());
        analyticsProps.put("orgId", application.getWorkspaceId());
        analyticsProps.put("old_branch", oldDefaultBranch);
        analyticsProps.put("new_branch", newDefaultBranch);
        analyticsProps.put(FieldName.GIT_HOSTING_PROVIDER, GitUtils.getGitProviderName(gitData.getRemoteUrl()));
        analyticsProps.put(FieldName.REPO_URL, gitData.getRemoteUrl());

        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> analyticsService.sendEvent(
                        GIT_UPDATE_DEFAULT_BRANCH.getEventName(), user.getUsername(), analyticsProps));
    }
}
