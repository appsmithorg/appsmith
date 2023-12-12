package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.ApplicationPublishingMetaDTO;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.ce.GitAutoCommitHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.publish.publishable.ApplicationPublishableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ApplicationPageServiceImpl extends ApplicationPageServiceCEImpl implements ApplicationPageService {

    private final PermissionGroupService permissionGroupService;
    private final ApplicationPublishableService<ModuleInstance> moduleInstanceApplicationPublishableService;

    public ApplicationPageServiceImpl(
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            SessionUserService sessionUserService,
            WorkspaceRepository workspaceRepository,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            ApplicationRepository applicationRepository,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            GitFileUtils gitFileUtils,
            ThemeService themeService,
            ResponseUtils responseUtils,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            TransactionalOperator transactionalOperator,
            PermissionGroupService permissionGroupService,
            ActionCollectionRepository actionCollectionRepository,
            NewActionRepository newActionRepository,
            NewPageRepository newPageRepository,
            DatasourceRepository datasourceRepository,
            DatasourcePermission datasourcePermission,
            ApplicationPublishableService<ModuleInstance> moduleInstanceApplicationPublishableService,
            DSLMigrationUtils dslMigrationUtils,
            GitAutoCommitHelper gitAutoCommitHelper) {
        super(
                workspaceService,
                applicationService,
                sessionUserService,
                workspaceRepository,
                layoutActionService,
                updateLayoutService,
                analyticsService,
                policyGenerator,
                applicationRepository,
                newPageService,
                newActionService,
                actionCollectionService,
                gitFileUtils,
                themeService,
                responseUtils,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                transactionalOperator,
                permissionGroupService,
                actionCollectionRepository,
                newActionRepository,
                newPageRepository,
                datasourceRepository,
                datasourcePermission,
                dslMigrationUtils,
                gitAutoCommitHelper);
        this.permissionGroupService = permissionGroupService;
        this.moduleInstanceApplicationPublishableService = moduleInstanceApplicationPublishableService;
    }

    /**
     * This method performs a soft delete on the application, its associated pages and actions.
     * The method also deletes the default application roles associated with the application.
     * @param id The application id to delete
     * @return The modified application object with the deleted flag set
     */
    @Override
    public Mono<Application> deleteApplication(String id) {
        Mono<Application> deletedApplicationMono = super.deleteApplication(id).cache();
        Flux<PermissionGroup> defaultApplicationRoles = deletedApplicationMono.flatMapMany(deletedApplication ->
                permissionGroupService.getAllDefaultRolesForApplication(deletedApplication, Optional.empty()));
        return defaultApplicationRoles
                .flatMap(role -> permissionGroupService.deleteWithoutPermission(role.getId()))
                .then(deletedApplicationMono);
    }

    @Override
    protected Mono<Tuple2<Mono<Application>, ApplicationPublishingMetaDTO>> publishAndGetMetadata(
            String applicationId, boolean isPublishedManually) {
        // Execute publish operation and extract the Application Mono
        // TODO: Move existing entities to this new structure and we can parallelize the publish process for each of
        // this
        Mono<Tuple2<Mono<Application>, ApplicationPublishingMetaDTO>> applicationPublishMetadataMono =
                super.publishAndGetMetadata(applicationId, isPublishedManually);

        // Create the ApplicationPublishingMetaDTO
        ApplicationPublishingMetaDTO applicationPublishingMetaDTO = ApplicationPublishingMetaDTO.builder()
                .applicationId(applicationId)
                .isPublishedManually(isPublishedManually)
                .build();

        // Publish module instances
        Mono<List<ModuleInstance>> moduleInstancePublishMono =
                moduleInstanceApplicationPublishableService.publishEntities(applicationPublishingMetaDTO);

        // To reduce the time taken to publish an app, we parallelize the operations
        return Mono.zip(applicationPublishMetadataMono, moduleInstancePublishMono)
                .map(Tuple2::getT1);
    }
}
