package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
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
    private final ExportableService<NewPage> newPageExportableService;
    private final ExportableService<NewAction> newActionExportableService;
    private final ExportableService<ActionCollection> actionCollectionExportableService;
    private final ExportableServiceCE<Theme> themeExportableService;
    private final ExportableService<CustomJSLib> customJSLibExportableService;
    private final Gson gson;

    @Override
    public Mono<ExportFileDTO> getPartialExportResources(
            String applicationId, String pageId, String branchName, MultiValueMap<String, String> params) {
        /*
         * Params has ids for actions, customJsLibs and datasource
         * Export the resources based on the value of these entities
         */

        /*if (params.containsKey(FieldName.DATASOURCE_ID)) {
            // export datasource
        }*/

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
                    if (params.containsKey(FieldName.DATASOURCE_ID)) {
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
                                .zipWith(branchedPageIdMono);
                    }
                    return Mono.just(applicationJson).zipWith(branchedPageIdMono);
                })
                .flatMap(tuple -> {
                    String branchedPageId1 = tuple.getT2();
                    if (params.containsKey(FieldName.ACTION_ID)
                            || params.containsKey(FieldName.ACTION_COLLECTION_LIST)) {
                        // export actions
                        return exportActions(
                                        branchedPageId1, Set.copyOf(params.get(FieldName.ACTION_ID)), applicationJson)
                                .zipWith(Mono.just(branchedPageId1));
                    }
                    return Mono.just(applicationJson).zipWith(Mono.just(branchedPageId1));
                })
                .flatMap(tuple -> {
                    String branchedPageId1 = tuple.getT2();
                    if (params.containsKey(FieldName.ACTION_COLLECTION_LIST)) {
                        // export js objects
                        return exportActionCollections(
                                branchedPageId1,
                                Set.copyOf(params.get(FieldName.ACTION_COLLECTION_LIST)),
                                applicationJson);
                    }
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
            String pageId, Set<String> validActions, ApplicationJson applicationJson) {
        // Get the correctPageId by using the branchName
        return newActionService.findByPageId(pageId).collectList().flatMap(actions -> {
            List<NewAction> updatedActionList = actions.stream()
                    .filter(action -> validActions.contains(action.getId()))
                    // .peek(NewAction::sanitiseToExportDBObject)
                    .toList();
            // Make it exportable by removing the ids
            applicationJson.setActionList(updatedActionList);
            return Mono.just(applicationJson);
        });
    }

    private Mono<ApplicationJson> exportActionCollections(
            String pageId, Set<String> validActions, ApplicationJson applicationJson) {
        return actionCollectionService.findByPageId(pageId).collectList().flatMap(actionCollections -> {
            List<ActionCollection> updatedActionCollectionList = actionCollections.stream()
                    .filter(actionCollection -> validActions.contains(actionCollection.getId()))
                    .toList();
            applicationJson.setActionCollectionList(updatedActionCollectionList);
            return Mono.just(applicationJson);
        });
    }
}
