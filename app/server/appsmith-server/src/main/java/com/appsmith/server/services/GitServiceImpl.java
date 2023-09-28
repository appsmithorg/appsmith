package com.appsmith.server.services;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.ce.GitServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class GitServiceImpl extends GitServiceCEImpl implements GitService {

    private final ApplicationService applicationService;

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
            ImportExportApplicationService importExportApplicationService,
            GitExecutor gitExecutor,
            ResponseUtils responseUtils,
            EmailConfig emailConfig,
            AnalyticsService analyticsService,
            GitDeployKeysRepository gitDeployKeysRepository,
            DatasourceService datasourceService,
            PluginService pluginService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
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
                importExportApplicationService,
                gitExecutor,
                responseUtils,
                emailConfig,
                analyticsService,
                gitDeployKeysRepository,
                datasourceService,
                pluginService,
                datasourcePermission,
                applicationPermission,
                workspaceService,
                redisUtils,
                observationRegistry,
                gitPrivateRepoHelper);
        this.applicationService = applicationService;
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
