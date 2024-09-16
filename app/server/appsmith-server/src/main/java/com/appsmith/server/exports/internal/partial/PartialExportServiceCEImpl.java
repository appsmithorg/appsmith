package com.appsmith.server.exports.internal.partial;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.PartialExportFileDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

@Slf4j
@RequiredArgsConstructor
public class PartialExportServiceCEImpl implements PartialExportServiceCE {

    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final CustomJSLibService customJSLibService;
    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final NewPageService newPageService;
    private final ExportableService<Datasource> datasourceExportableService;
    private final ExportableService<Plugin> pluginExportableService;
    private final ExportableService<NewAction> newActionExportableService;
    private final ExportableService<ActionCollection> actionCollectionExportableService;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final JsonSchemaVersions jsonSchemaVersions;

    @Override
    public Mono<ApplicationJson> getPartialExportResources(
            String branchedApplicationId, String branchedPageId, PartialExportFileDTO partialExportFileDTO) {
        /*
         * Params has ids for actions, customJsLibs and datasource
         * Export the resources based on the value of these entities
         */

        ApplicationJson applicationJson = new ApplicationJson();
        final MappedExportableResourcesDTO mappedResourcesDTO = new MappedExportableResourcesDTO();
        final ExportingMetaDTO exportingMetaDTO = new ExportingMetaDTO();

        exportingMetaDTO.setArtifactType(FieldName.APPLICATION);
        exportingMetaDTO.setArtifactId(branchedApplicationId);
        exportingMetaDTO.setBranchName(null);
        exportingMetaDTO.setIsGitSync(false);
        exportingMetaDTO.setExportWithConfiguration(false);

        // Set json schema version which will be used to check the compatibility while importing the JSON
        applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        applicationJson.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());

        AclPermission permission = applicationPermission.getExportPermission(false, false);

        Mono<Application> applicationMono = applicationService
                .findById(branchedApplicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
                .cache();

        return applicationMono
                .flatMap(application -> {
                    applicationJson.setExportedApplication(application);
                    return pluginExportableService
                            .getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson)
                            .thenReturn(applicationJson);
                })
                .flatMap(pluginList -> {
                    if (partialExportFileDTO.getDatasourceList().size() > 0) {
                        return datasourceExportableService
                                .getExportableEntities(
                                        exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson)
                                .thenReturn(applicationJson);
                    }
                    return Mono.just(applicationJson);
                })
                .flatMap(appJson -> {
                    if (partialExportFileDTO.getCustomJsLib().size() > 0) {
                        return exportFilteredCustomJSLib(
                                        branchedApplicationId, partialExportFileDTO.getCustomJsLib(), applicationJson)
                                .flatMap(jsLibList -> {
                                    return Mono.just(branchedPageId);
                                });
                    } else {
                        return Mono.just(branchedPageId);
                    }
                })
                // update page name in meta and exportable DTO for resource to name mapping
                .flatMap(branchedPageId1 -> updatePageNameInResourceMapDTO(branchedPageId, mappedResourcesDTO))
                // export actions
                // export js objects
                .flatMap(branchedPageId1 -> {
                    if (partialExportFileDTO.getActionCollectionList().size() > 0) {
                        return exportActionCollections(
                                        branchedPageId,
                                        partialExportFileDTO.getActionCollectionList(),
                                        applicationJson,
                                        exportingMetaDTO,
                                        mappedResourcesDTO)
                                .then(Mono.just(branchedPageId));
                    }
                    return Mono.just(branchedPageId);
                })
                .flatMap(branchedPageId1 -> {
                    if (partialExportFileDTO.getActionCollectionList().size() > 0
                            || partialExportFileDTO.getActionList().size() > 0) {
                        return exportActions(
                                        branchedPageId,
                                        partialExportFileDTO.getActionList(),
                                        applicationJson,
                                        exportingMetaDTO,
                                        mappedResourcesDTO)
                                .then(Mono.just(branchedPageId));
                    }
                    return Mono.just(branchedPageId);
                })
                .flatMap(appJson -> {
                    // Remove the datasources not in use
                    if (partialExportFileDTO.getDatasourceList().size() > 0) {
                        exportDatasource(partialExportFileDTO.getDatasourceList(), applicationJson);
                        // Sanitise the datasource
                        datasourceExportableService.sanitizeEntities(
                                exportingMetaDTO,
                                mappedResourcesDTO,
                                applicationJson,
                                SerialiseArtifactObjective.SHARE);
                    }
                    return Mono.just(applicationJson).zipWith(sessionUserService.getCurrentUser());
                })
                .flatMap(tuple -> {
                    ApplicationJson applicationJson1 = tuple.getT1();
                    Application application = applicationJson1.getExportedApplication();

                    applicationJson.setWidgets(partialExportFileDTO.getWidget());
                    applicationJson.setExportedApplication(null);

                    User user = tuple.getT2();
                    final Map<String, Object> eventData = Map.of(FieldName.APPLICATION, application);

                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, application.getId(),
                            FieldName.WORKSPACE_ID, application.getWorkspaceId(),
                            FieldName.EVENT_DATA, eventData);

                    return analyticsService
                            .sendEvent(AnalyticsEvents.PARTIAL_EXPORT.getEventName(), user.getUsername(), data)
                            .thenReturn(applicationJson);
                });
    }

    private void exportDatasource(List<String> validDatasource, ApplicationJson applicationJson) {
        List<DatasourceStorage> datasourceList = applicationJson.getDatasourceList().stream()
                .filter(datasourceStorage -> validDatasource.contains(datasourceStorage.getDatasourceId()))
                .toList();
        applicationJson.setDatasourceList(datasourceList);
    }

    private Mono<ApplicationJson> exportFilteredCustomJSLib(
            String branchedApplicationId, List<String> customJSLibSet, ApplicationJson applicationJson) {
        return customJSLibService
                .getAllJSLibsInContext(branchedApplicationId, CreatorContextType.APPLICATION, false)
                .flatMap(customJSLibs -> {
                    List<CustomJSLib> updatedCustomJSLibList = customJSLibs.stream()
                            .filter(customJSLib -> customJSLibSet.contains(customJSLib.getId()))
                            .peek(CustomJSLib::sanitiseToExportDBObject)
                            .toList();
                    applicationJson.setCustomJSLibList(updatedCustomJSLibList);
                    return Mono.just(applicationJson);
                });
    }

    private Mono<ApplicationJson> exportActions(
            String branchedPageId,
            List<String> validActions,
            ApplicationJson applicationJson,
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO) {
        return newActionService.findByPageId(branchedPageId).collectList().flatMap(actions -> {
            // For git connected app, the filtering has to be done on the default action id
            // since the client is not aware of the branched resource id
            List<NewAction> updatedActionList = actions.stream()
                    .filter(action -> validActions.contains(action.getId()))
                    .toList();

            // Map name to id for exportable entities
            newActionExportableService.mapNameToIdForExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, updatedActionList);
            // Make it exportable by removing the ids
            updatedActionList = updatedActionList.stream()
                    .peek(NewAction::sanitiseToExportDBObject)
                    .collect(Collectors.toList());
            applicationJson.setActionList(updatedActionList);
            return Mono.just(applicationJson);
        });
    }

    private Mono<ApplicationJson> exportActionCollections(
            String branchedPageId,
            List<String> validActions,
            ApplicationJson applicationJson,
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO) {
        return actionCollectionService
                .findByPageId(branchedPageId)
                .collectList()
                .flatMap(actionCollections -> {
                    // For git connected app, the filtering has to be done on the default actionCollection id
                    // since the client is not aware of the branched resource id
                    List<ActionCollection> updatedActionCollectionList = actionCollections.stream()
                            .filter(actionCollection -> validActions.contains(actionCollection.getId()))
                            .toList();
                    // Map name to id for exportable entities
                    actionCollectionExportableService.mapNameToIdForExportableEntities(
                            exportingMetaDTO, mappedResourcesDTO, updatedActionCollectionList);
                    // Make it exportable by removing the ids
                    updatedActionCollectionList = updatedActionCollectionList.stream()
                            .peek(ActionCollection::sanitiseToExportDBObject)
                            .collect(Collectors.toList());
                    applicationJson.setActionCollectionList(updatedActionCollectionList);
                    return Mono.just(applicationJson);
                });
    }

    private Mono<String> updatePageNameInResourceMapDTO(
            String pageId, MappedExportableResourcesDTO mappedResourcesDTO) {
        return newPageService.getNameByPageId(pageId, false).flatMap(pageName -> {
            mappedResourcesDTO.getContextIdToNameMap().put(pageId + EDIT, pageName);
            mappedResourcesDTO.getContextIdToNameMap().put(pageId + VIEW, pageName);
            return Mono.just(pageId);
        });
    }
}
