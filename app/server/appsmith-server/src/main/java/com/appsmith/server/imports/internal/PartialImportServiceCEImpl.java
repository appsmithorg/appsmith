package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Slf4j
public class PartialImportServiceCEImpl implements PartialImportServiceCE {

    private final ImportApplicationService importApplicationService;
    private final DatasourceService datasourceService;
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final NewActionService newActionService;
    private final AnalyticsService analyticsService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final Gson gson;
    private final TransactionalOperator transactionalOperator;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ImportableService<Plugin> pluginImportableService;
    private final ImportableService<Theme> themeImportableService;
    private final ImportableService<NewPage> newPageImportableService;
    private final ImportableService<CustomJSLib> customJSLibImportableService;
    private final ImportableService<Datasource> datasourceImportableService;
    private final ImportableService<NewAction> newActionImportableService;
    private final ImportableService<ActionCollection> actionCollectionImportableService;

    @Override
    public Mono<Application> importResourceInPage(
            String workspaceId, String applicationId, String pageId, String branchName, Part file) {
        /*
        1. Get branchedPageId from pageId and branchName
        2. Get Application Mono
        3. Prepare the Meta DTO's
        4. Get plugin data
        5. Import datasources
        6. Import customJsLib
        7. Import actions
        8. Import actionCollection
         */

        // Extract file and get App Json
        /*getImportApplicationPermissions()
        .flatMap(permissionProvider -> {
            ImportingMetaDTO importingMetaDTO =
                new ImportingMetaDTO(workspaceId, applicationId, branchName, false, permissionProvider);

            MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();

            // Updates plugin map in importable resources
            Mono<Void> installedPluginsMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

            datasourceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

            // Set Application in App JSON, remove the pages other than the one to be imported in
            // Set the current page in the JSON to be imported
            // Debug and get the value from getImportApplicationMono method if any difference
            // Modify the Application set in JSON to be imported
        });*/

        return null;
    }

    @NotNull private Mono<ImportApplicationPermissionProvider> getImportApplicationPermissions() {
        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                    .requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                    .permissionRequiredToCreateDatasource(true)
                    .permissionRequiredToEditDatasource(true)
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();
            return Mono.just(permissionProvider);
        });
    }
}
