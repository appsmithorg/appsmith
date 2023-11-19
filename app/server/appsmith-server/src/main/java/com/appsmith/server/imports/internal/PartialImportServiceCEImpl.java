package com.appsmith.server.imports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequiredArgsConstructor
@Slf4j
public class PartialImportServiceCEImpl implements PartialImportServiceCE {

    private final ImportApplicationService importApplicationService;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
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
    private final ImportableService<NewPage> newPageImportableService;
    private final ImportableService<CustomJSLib> customJSLibImportableService;
    private final ImportableService<Datasource> datasourceImportableService;
    private final ImportableService<NewAction> newActionImportableService;
    private final ImportableService<ActionCollection> actionCollectionImportableService;
    private final NewPageService newPageService;

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

        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();

        Mono<String> branchedPageIdMono =
                newPageService.findBranchedPageId(branchName, pageId, AclPermission.MANAGE_PAGES);

        // Extract file and get App Json
        Mono<Application> partiallyImportedAppMono = importApplicationService
                .extractApplicationJson(file)
                .zipWith(getImportApplicationPermissions())
                .flatMap(tuple -> {
                    ApplicationJson applicationJson = tuple.getT1();
                    ImportApplicationPermissionProvider permissionProvider = tuple.getT2();
                    // Set Application in App JSON, remove the pages other than the one to be imported in
                    // Set the current page in the JSON to be imported
                    // Debug and get the value from getImportApplicationMono method if any difference
                    // Modify the Application set in JSON to be imported

                    Mono<Workspace> workspaceMono = workspaceService
                            .findById(workspaceId, permissionProvider.getRequiredPermissionOnTargetWorkspace())
                            .switchIfEmpty(Mono.defer(() -> {
                                log.error(
                                        "No workspace found with id: {} and permission: {}",
                                        workspaceId,
                                        permissionProvider.getRequiredPermissionOnTargetWorkspace());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId));
                            }))
                            .cache();

                    ImportingMetaDTO importingMetaDTO =
                            new ImportingMetaDTO(workspaceId, applicationId, branchName, false, permissionProvider);

                    // Get the Application from DB
                    Mono<Application> importedApplicationMono = applicationService
                            .findByBranchNameAndDefaultApplicationId(
                                    branchName,
                                    applicationId,
                                    permissionProvider.getRequiredPermissionOnTargetApplication())
                            .cache();

                    return importedApplicationMono
                            .flatMap(application -> {
                                applicationJson.setExportedApplication(application);
                                return Mono.just(applicationJson);
                            })
                            // Import Custom Js Lib and Datasource
                            .then(getApplicationImportableEntities(
                                    importingMetaDTO,
                                    mappedImportableResourcesDTO,
                                    workspaceMono,
                                    importedApplicationMono,
                                    applicationJson))
                            .thenReturn("done")
                            // Update the pageName map for actions and action collection
                            .then(paneNameMapForActionAndActionCollectionInAppJson(
                                    branchedPageIdMono, applicationJson, mappedImportableResourcesDTO))
                            .thenReturn("done")
                            // Import Actions and action collection
                            .then(getActionAndActionCollectionImport(
                                    importingMetaDTO,
                                    mappedImportableResourcesDTO,
                                    workspaceMono,
                                    importedApplicationMono,
                                    applicationJson))
                            .thenReturn("done")
                            .then(Mono.defer(() -> {
                                Application application = applicationJson.getExportedApplication();
                                return newActionImportableService
                                        .updateImportedEntities(
                                                application, importingMetaDTO, mappedImportableResourcesDTO)
                                        .then(newPageImportableService.updateImportedEntities(
                                                application, importingMetaDTO, mappedImportableResourcesDTO))
                                        .flatMap(
                                                newPage -> applicationService.update(String.valueOf(application.getId()), application));
                            }));
                })
                .as(transactionalOperator::transactional);

        // Send Analytics event
        return partiallyImportedAppMono.flatMap(application -> {
            final Map<String, Object> eventData = Map.of(FieldName.APPLICATION, application);

            final Map<String, Object> data = Map.of(
                    FieldName.APPLICATION_ID, application.getId(),
                    FieldName.WORKSPACE_ID, application.getWorkspaceId(),
                    FieldName.EVENT_DATA, eventData);

            return analyticsService.sendObjectEvent(AnalyticsEvents.PARTIAL_IMPORT, application, data);
        });
    }

    private Mono<ImportApplicationPermissionProvider> getImportApplicationPermissions() {
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

    private Mono<Void> getApplicationImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {
        Mono<Void> customJSLibMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> datasourceMono = datasourceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> customJsLibMono = customJSLibImportableService.importEntities(
                importingMetaDTO, mappedImportableResourcesDTO, null, null, applicationJson);

        return Flux.merge(List.of(customJsLibMono, datasourceMono, customJSLibMono))
                .then();
    }

    private Mono<Void> getActionAndActionCollectionImport(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {
        Mono<Void> actionMono = newActionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> actionCollectionMono = actionCollectionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        return Flux.merge(List.of(actionMono, actionCollectionMono)).then();
    }

    private Mono<String> paneNameMapForActionAndActionCollectionInAppJson(
            Mono<String> branchedPageIdMono,
            ApplicationJson applicationJson,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return Mono.empty();/*
        return branchedPageIdMono.flatMap(
                pageId -> newPageService.findById(pageId, Optional.empty()).flatMap(newPage -> {
                    String pageName = newPage.getUnpublishedPage().getName();
                    // update page name reference with newPage
                    Map<String, NewPage> pageNameMap = new HashMap<>();
                    pageNameMap.put(pageName, newPage);
                    mappedImportableResourcesDTO.setPageNameMap(pageNameMap);

                    applicationJson.getActionList().forEach(action -> {
                        action.getPublishedAction().setPageId(pageName);
                        action.getUnpublishedAction().setPageId(pageName);
                        if (action.getPublishedAction().getCollectionId() != null) {
                            String collectionName = action.getPublishedAction()
                                    .getCollectionId()
                                    .split("_")[1];
                            action.getPublishedAction().setCollectionId(pageName + "_" + collectionName);
                            action.getUnpublishedAction().setCollectionId(pageName + "_" + collectionName);
                        }

                        String actionName = action.getId().split("_")[1];
                        action.setId(pageName + "_" + actionName);
                        action.setGitSyncId(null);
                    });

                    applicationJson.getActionCollectionList().forEach(actionCollection -> {
                        actionCollection.getPublishedCollection().setPageId(pageName);
                        actionCollection.getUnpublishedCollection().setPageId(pageName);

                        String collectionName = actionCollection.getId().split("_")[1];
                        actionCollection.setId(pageName + "_" + collectionName);
                        actionCollection.setGitSyncId(null);
                    });
                    return Mono.just(pageName);
                }));*/
    }
}
