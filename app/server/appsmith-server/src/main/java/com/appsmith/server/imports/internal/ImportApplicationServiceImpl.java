package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Service
@Primary
public class ImportApplicationServiceImpl extends ImportApplicationServiceCEImpl implements ImportApplicationService {

    private final ImportableService<Module> moduleImportableService;
    private final ImportableService<ModuleInstance> moduleInstanceImportableService;

    public ImportApplicationServiceImpl(
            DatasourceService datasourceService,
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService,
            AnalyticsService analyticsService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            Gson gson,
            TransactionalOperator transactionalOperator,
            PermissionGroupRepository permissionGroupRepository,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<Theme> themeImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<Datasource> datasourceImportableService,
            ImportableService<NewAction> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService,
            PermissionGroupService permissionGroupService,
            ImportableService<Module> moduleImportableService,
            ImportableService<ModuleInstance> moduleInstanceImportableService,
            UpdateLayoutService updateLayoutService) {
        super(
                datasourceService,
                sessionUserService,
                workspaceService,
                applicationService,
                applicationPageService,
                newActionService,
                analyticsService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                gson,
                transactionalOperator,
                permissionGroupRepository,
                pluginImportableService,
                themeImportableService,
                newPageImportableService,
                customJSLibImportableService,
                datasourceImportableService,
                newActionImportableService,
                actionCollectionImportableService,
                permissionGroupService,
                updateLayoutService);
        this.moduleImportableService = moduleImportableService;
        this.moduleInstanceImportableService = moduleInstanceImportableService;
    }

    @Override
    protected List<Mono<Void>> getPageDependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {
        List<Mono<Void>> pageDependentImportables = super.getPageDependentImportables(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> importedModulesMono = moduleImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        Mono<Void> importedModuleInstancesMono = moduleInstanceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        Mono<Void> moduleInstanceMono = importedModulesMono.then(Mono.defer(() -> importedModuleInstancesMono));

        Mono<Void> pageDependentsMono = moduleInstanceMono
                .thenMany(Flux.defer(() -> Flux.merge(pageDependentImportables)))
                .then();

        return List.of(pageDependentsMono);
    }
}
