package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
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
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ResponseUtils;
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
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.external.constants.GitConstants.GIT_CONFIG_ERROR;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class GitServiceImpl extends GitServiceCECompatibleImpl implements GitService {
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;

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
            GitPrivateRepoHelper gitPrivateRepoHelper) {
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
                gitPrivateRepoHelper);
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_git_branch_protection_enabled)
    public Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName) {
        if (!StringUtils.hasLength(newDefaultBranchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        // get the application by default application id and the new default branch name
        return applicationService
                .findByBranchNameAndDefaultApplicationId(
                        newDefaultBranchName, defaultApplicationId, applicationPermission.getEditPermission())
                .flatMapMany(application -> {
                    if (application.getGitApplicationMetadata() == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                GIT_CONFIG_ERROR)); // application not connected to Git, throw error
                    }
                    return applicationService.findAllApplicationsByDefaultApplicationId(
                            defaultApplicationId, applicationPermission.getEditPermission());
                })
                .flatMap(application -> {
                    // update the application with the new default branch name
                    application.getGitApplicationMetadata().setDefaultBranchName(newDefaultBranchName);
                    return applicationService.save(application);
                })
                .then(Mono.just(newDefaultBranchName));
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
    public Mono<Application> protectBranch(String defaultApplicationId, String branchName) {
        return getApplicationById(defaultApplicationId)
                .zipWith(applicationService.findByIdAndBranchName(defaultApplicationId, branchName))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    Application branchApplication = tuple.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if (gitApplicationMetadata.getBranchProtectionRules() == null) {
                        List<String> branchProtectionRules = List.of(branchName);
                        gitApplicationMetadata.setBranchProtectionRules(branchProtectionRules);
                    } else {
                        gitApplicationMetadata.getBranchProtectionRules().add(branchName);
                    }
                    branchApplication.getGitApplicationMetadata().setIsProtectedBranch(true);
                    return applicationService.save(application).then(applicationService.save(branchApplication));
                });
    }

    @Override
    public Mono<Application> unProtectBranch(String defaultApplicationId, String branchName) {
        return getApplicationById(defaultApplicationId)
                .zipWith(applicationService.findByIdAndBranchName(defaultApplicationId, branchName))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    Application branchApplication = tuple.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    gitApplicationMetadata.getBranchProtectionRules().remove(branchName);

                    branchApplication.getGitApplicationMetadata().setIsProtectedBranch(false);
                    return applicationService.save(application).then(applicationService.save(branchApplication));
                });
    }

    @Override
    public Mono<List<String>> getProtectedBranches(String defaultApplicationId) {
        return applicationService
                .getApplicationByDefaultApplicationIdAndDefaultBranch(defaultApplicationId)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    return Mono.justOrEmpty(gitApplicationMetadata.getBranchProtectionRules());
                });
    }
}
