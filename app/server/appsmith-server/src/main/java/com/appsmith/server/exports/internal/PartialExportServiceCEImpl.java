package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
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
    private final Gson gson;

    @Override
    public Mono<ExportFileDTO> getPartialExportResources(
            String applicationId, String pageId, String branchName, MultiValueMap<String, String> params) {
        /*
         * Params has ids for actions, customJsLibs and datasource
         * Export the resources based on the value of these entities
         */

        ApplicationJson applicationJson = new ApplicationJson();
        final MappedExportableResourcesDTO mappedResourcesDTO = new MappedExportableResourcesDTO();
        final ExportingMetaDTO exportingMetaDTO = new ExportingMetaDTO();

        exportingMetaDTO.setApplicationId(applicationId);
        exportingMetaDTO.setBranchName(null);
        exportingMetaDTO.setIsGitSync(false);
        exportingMetaDTO.setExportWithConfiguration(false);

        // Set json schema version which will be used to check the compatibility while importing the JSON
        applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

        AclPermission permission = applicationPermission.getExportPermission(false, false);
        Mono<String> branchedPageIdMono = newPageService
                .findBranchedPageId(pageId, branchName, AclPermission.MANAGE_PAGES)
                .cache();

        Mono<Application> applicationMono = applicationService
                .findById(applicationId, permission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));

        return pluginExportableService
                .getExportableEntities(exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson)
                .then(applicationMono)
                .flatMap(application -> {
                    if (params.containsKey(FieldName.DATASOURCE_LIST)) {
                        return datasourceExportableService.getExportableEntities(
                                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);
                    }
                    return Mono.just(applicationJson);
                })
                .flatMap(appJson -> {
                    if (params.containsKey(FieldName.CUSTOM_JS_LIB_LIST)) {
                        return exportFilteredCustomJSLib(
                                        applicationId,
                                        Set.copyOf(params.get(FieldName.CUSTOM_JS_LIB_LIST)),
                                        applicationJson)
                                .then(branchedPageIdMono);
                    }
                    return branchedPageIdMono;
                })
                // update page name in meta and exportable DTO for resource to name mapping
                .flatMap(branchedPageId -> updatePageNameInResourceMapDTO(applicationId, mappedResourcesDTO))
                // export actions
                .flatMap(branchedPageId -> {
                    if (params.containsKey(FieldName.ACTION_LIST)
                            || params.containsKey(FieldName.ACTION_COLLECTION_LIST)) {
                        return exportActions(
                                        branchedPageId,
                                        Set.copyOf(params.get(FieldName.ACTION_LIST)),
                                        applicationJson,
                                        mappedResourcesDTO)
                                .then(Mono.just(branchedPageId));
                    }
                    return Mono.just(branchedPageId);
                })
                // export js objects
                .flatMap(branchedPageId -> {
                    if (params.containsKey(FieldName.ACTION_COLLECTION_LIST)) {
                        return exportActionCollections(
                                branchedPageId,
                                Set.copyOf(params.get(FieldName.ACTION_COLLECTION_LIST)),
                                applicationJson,
                                mappedResourcesDTO);
                    }
                    return Mono.just(applicationJson);
                })
                .flatMap(appJson -> {
                    // Remove the datasources not in use
                    exportDatasource(Set.copyOf(params.get(FieldName.DATASOURCE_LIST)), applicationJson);
                    // Sanitise the datasource
                    datasourceExportableService.sanitizeEntities(
                            exportingMetaDTO, mappedResourcesDTO, applicationJson, SerialiseApplicationObjective.SHARE);
                    return Mono.just(applicationJson);
                })
                .map(exportedJson -> {
                    String stringifiedFile = gson.toJson(exportedJson);
                    String applicationName = "pageName";
                    Object jsonObject = gson.fromJson(stringifiedFile, Object.class);
                    HttpHeaders responseHeaders = new HttpHeaders();
                    ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                            .filename(applicationName + ".json", StandardCharsets.UTF_8)
                            .build();
                    responseHeaders.setContentDisposition(contentDisposition);
                    responseHeaders.setContentType(MediaType.APPLICATION_JSON);

                    ExportFileDTO exportFileDTO = new ExportFileDTO();
                    exportFileDTO.setApplicationResource(jsonObject);
                    exportFileDTO.setHttpHeaders(responseHeaders);
                    return exportFileDTO;
                });
    }

    private void exportDatasource(Set<String> validDatasource, ApplicationJson applicationJson) {
        List<DatasourceStorage> datasourceList = applicationJson.getDatasourceList().stream()
                .filter(datasourceStorage -> validDatasource.contains(datasourceStorage.getId()))
                .toList();
        applicationJson.setDatasourceList(datasourceList);
    }

    private Mono<ApplicationJson> exportFilteredCustomJSLib(
            String applicationId, Set<String> customJSLibSet, ApplicationJson applicationJson) {
        return customJSLibService
                .getAllJSLibsInApplicationForExport(applicationId, null, false)
                .flatMap(customJSLibs -> {
                    List<CustomJSLib> updatedCustomJSLibList = customJSLibs.stream()
                            .filter(customJSLib -> customJSLibSet.contains(customJSLib.getName()))
                            .toList();
                    applicationJson.setCustomJSLibList(updatedCustomJSLibList);
                    return Mono.just(applicationJson);
                });
    }

    private Mono<ApplicationJson> exportActions(
            String pageId,
            Set<String> validActions,
            ApplicationJson applicationJson,
            MappedExportableResourcesDTO mappedResourcesDTO) {
        return newActionService.findByPageId(pageId).collectList().flatMap(actions -> {
            List<NewAction> updatedActionList = actions.stream()
                    .filter(action -> validActions.contains(action.getId()))
                    .toList();
            // Map name to id for exportable entities
            newActionExportableService.mapNameToIdForExportableEntities(mappedResourcesDTO, updatedActionList);
            // Make it exportable by removing the ids
            updatedActionList = updatedActionList.stream()
                    .peek(NewAction::sanitiseToExportDBObject)
                    .collect(Collectors.toList());
            applicationJson.setActionList(updatedActionList);
            return Mono.just(applicationJson);
        });
    }

    private Mono<ApplicationJson> exportActionCollections(
            String pageId,
            Set<String> validActions,
            ApplicationJson applicationJson,
            MappedExportableResourcesDTO mappedResourcesDTO) {
        return actionCollectionService.findByPageId(pageId).collectList().flatMap(actionCollections -> {
            List<ActionCollection> updatedActionCollectionList = actionCollections.stream()
                    .filter(actionCollection -> validActions.contains(actionCollection.getId()))
                    .toList();
            // Map name to id for exportable entities
            actionCollectionExportableService.mapNameToIdForExportableEntities(
                    mappedResourcesDTO, updatedActionCollectionList);
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
        return newPageService.findById(pageId, AclPermission.READ_PAGES).flatMap(newPage -> {
            mappedResourcesDTO
                    .getPageIdToNameMap()
                    .put(pageId + EDIT, newPage.getUnpublishedPage().getName());
            mappedResourcesDTO
                    .getPageIdToNameMap()
                    .put(pageId + VIEW, newPage.getUnpublishedPage().getName());
            return Mono.just(pageId);
        });
    }
}
