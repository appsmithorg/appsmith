package com.appsmith.server.applications.base;

import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class ApplicationImportServiceImpl extends ApplicationImportServiceCEImpl implements ApplicationImportService {

    private final ImportableService<Module> moduleImportableService;
    private final ImportableService<ModuleInstance> moduleInstanceImportableService;

    public ApplicationImportServiceImpl(
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService,
            UpdateLayoutService updateLayoutService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            Gson gson,
            ImportableService<Theme> themeImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<NewAction> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService,
            ImportableService<Module> moduleImportableService,
            ImportableService<ModuleInstance> moduleInstanceImportableService) {
        super(
                applicationService,
                applicationPageService,
                newActionService,
                updateLayoutService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                gson,
                themeImportableService,
                newPageImportableService,
                customJSLibImportableService,
                newActionImportableService,
                actionCollectionImportableService);

        this.moduleInstanceImportableService = moduleInstanceImportableService;
        this.moduleImportableService = moduleImportableService;
    }

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
                applicationJson);

        Mono<Void> importedModuleInstancesMono = moduleInstanceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> moduleInstanceMono = importedModulesMono.then(Mono.defer(() -> importedModuleInstancesMono));

        Mono<Void> pageDependentsMono = moduleInstanceMono
                .thenMany(Flux.defer(() -> Flux.merge(pageDependentImportables)))
                .then();

        return List.of(pageDependentsMono);
    }
}
