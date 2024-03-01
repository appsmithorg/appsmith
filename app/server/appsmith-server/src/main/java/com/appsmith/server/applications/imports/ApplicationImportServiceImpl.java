package com.appsmith.server.applications.imports;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ApplicationImportServiceImpl extends ApplicationImportServiceCEImpl
        implements ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson> {

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
