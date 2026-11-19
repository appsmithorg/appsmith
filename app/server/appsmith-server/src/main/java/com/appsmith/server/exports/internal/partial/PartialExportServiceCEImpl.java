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
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.HashMap;
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
        exportingMetaDTO.setRefName(null);
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

        // Single page lookup: validates ownership and extracts the page name for resource mapping
        Mono<String> validatedPageNameMono = applicationMono
                .flatMap(application -> newPageService
                        .findById(branchedPageId, null)
                        .switchIfEmpty(Mono.error(
                                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, branchedPageId)))
                        .flatMap(page -> {
                            if (!application.getId().equals(page.getApplicationId())) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.PAGE_DOESNT_BELONG_TO_APPLICATION,
                                        branchedPageId,
                                        branchedApplicationId));
                            }
                            return Mono.just(page.getUnpublishedPage().getName());
                        }))
                .cache();

        return validatedPageNameMono
                .then(applicationMono)
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
                // Populate page name in resource map using the already-fetched page
                .flatMap(branchedPageId1 -> validatedPageNameMono.map(pageName -> {
                    mappedResourcesDTO.getContextIdToNameMap().put(branchedPageId + EDIT, pageName);
                    mappedResourcesDTO.getContextIdToNameMap().put(branchedPageId + VIEW, pageName);
                    return branchedPageId;
                }))
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
                    return Mono.just(applicationJson);
                })
                .flatMap(exportedJson -> {
                    Application application = exportedJson.getExportedApplication();

                    applicationJson.setWidgets(partialExportFileDTO.getWidget());
                    applicationJson.setExportedApplication(null);

                    final Map<String, Object> eventData = new HashMap<>();
                    eventData.put(FieldName.APPLICATION, application);
                    eventData.put(FieldName.PARTIAL_RESOURCE_COUNTS, buildPartialResourceCounts(partialExportFileDTO));

                    final Map<String, Object> data = new HashMap<>();
                    data.put(FieldName.APPLICATION_ID, application.getId());
                    data.put(FieldName.WORKSPACE_ID, application.getWorkspaceId());
                    data.put(FieldName.PAGE_ID, branchedPageId);
                    data.put(FieldName.EVENT_DATA, eventData);

                    return analyticsService
                            .sendObjectEvent(AnalyticsEvents.PARTIAL_EXPORT, application, data)
                            .thenReturn(applicationJson);
                });
    }

    private static Map<String, Object> buildPartialResourceCounts(PartialExportFileDTO partialExportFileDTO) {
        Map<String, Object> counts = new HashMap<>();
        counts.put(FieldName.ACTION_COUNT, collectionSize(partialExportFileDTO.getActionList()));
        counts.put(FieldName.ACTION_COLLECTION_COUNT, collectionSize(partialExportFileDTO.getActionCollectionList()));
        counts.put(FieldName.DATASOURCE_COUNT, collectionSize(partialExportFileDTO.getDatasourceList()));
        counts.put(FieldName.JS_LIB_COUNT, collectionSize(partialExportFileDTO.getCustomJsLib()));
        counts.put(FieldName.HAS_WIDGETS, StringUtils.hasText(partialExportFileDTO.getWidget()));
        return counts;
    }

    private static int collectionSize(Collection<?> collection) {
        return CollectionUtils.isEmpty(collection) ? 0 : collection.size();
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
                            .filter(customJSLib -> customJSLibSet.contains(customJSLib.getId())
                                    || customJSLibSet.contains(customJSLib.getName()))
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
}
