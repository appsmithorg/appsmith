package com.appsmith.server.fork.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.moduleinstances.metadata.ModuleInstanceMetadataService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ApplicationForkingServiceImpl extends ApplicationForkingServiceCEImpl
        implements ApplicationForkingService {
    private final ApplicationService applicationService;
    private final WorkspaceService workspaceService;
    private final ModuleInstanceMetadataService moduleInstanceMetadataService;

    public ApplicationForkingServiceImpl(
            ApplicationService applicationService,
            WorkspaceService workspaceService,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ResponseUtils responseUtils,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            NewPageRepository newPageRepository,
            ImportService importService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService,
            LayoutActionService layoutActionService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            PermissionGroupService permissionGroupService,
            ActionCollectionRepository actionCollectionRepository,
            NewActionRepository newActionRepository,
            WorkspaceRepository workspaceRepository,
            ForkableService<Datasource> datasourceForkableService,
            ModuleInstanceMetadataService moduleInstanceMetadataService) {

        super(
                applicationService,
                workspaceService,
                sessionUserService,
                analyticsService,
                responseUtils,
                workspacePermission,
                applicationPermission,
                importService,
                applicationPageService,
                newPageRepository,
                newActionService,
                layoutActionService,
                actionCollectionService,
                themeService,
                pagePermission,
                actionPermission,
                permissionGroupService,
                actionCollectionRepository,
                newActionRepository,
                workspaceRepository,
                datasourceForkableService);

        this.applicationService = applicationService;
        this.workspaceService = workspaceService;
        this.moduleInstanceMetadataService = moduleInstanceMetadataService;
    }

    @Override
    public Mono<Application> forkApplicationToWorkspaceWithEnvironment(
            String srcApplicationId, String targetWorkspaceId, String environmentId) {
        Mono<String> fromEnvironmentIdMono = applicationService
                .findById(srcApplicationId)
                .map(Application::getWorkspaceId)
                .flatMap(workspaceId -> workspaceService.getDefaultEnvironmentId(workspaceId, null));

        return fromEnvironmentIdMono.flatMap(fromEnvironmentId -> super.forkApplicationToWorkspaceWithEnvironment(
                srcApplicationId, targetWorkspaceId, fromEnvironmentId));
    }

    @Override
    protected Mono<Boolean> isForkingEnabled(Mono<Application> applicationMono) {
        Mono<Boolean> forkingEnabledCheckForModuleInstanceMono = applicationMono.flatMap(application -> {
            return moduleInstanceMetadataService
                    .getModuleInstanceCountByApplicationId(application.getId())
                    .flatMap(moduleInstanceCount -> {
                        if (moduleInstanceCount > 0) {
                            return Mono.error(new AppsmithException(AppsmithError.APPLICATION_FORKING_NOT_ALLOWED));
                        }
                        return Mono.just(Boolean.TRUE);
                    });
        });
        return super.isForkingEnabled(applicationMono).flatMap(enabled -> {
            return forkingEnabledCheckForModuleInstanceMono.thenReturn(enabled);
        });
    }
}
