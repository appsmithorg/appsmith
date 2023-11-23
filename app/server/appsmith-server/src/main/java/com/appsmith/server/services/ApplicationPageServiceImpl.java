package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
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

import java.util.Optional;

@Service
@Slf4j
public class ApplicationPageServiceImpl extends ApplicationPageServiceCEImpl implements ApplicationPageService {

    private final PermissionGroupService permissionGroupService;

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
            DatasourcePermission datasourcePermission) {
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
                datasourcePermission);
        this.permissionGroupService = permissionGroupService;
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
}
