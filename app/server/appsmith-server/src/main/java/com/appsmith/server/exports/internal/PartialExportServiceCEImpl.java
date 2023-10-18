package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.migrations.JsonSchemaVersions;
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
    private final ExportableService<Datasource> datasourceExportableService;
    private final ExportableService<Plugin> pluginExportableService;
    private final ExportableService<NewPage> newPageExportableService;
    private final ExportableService<NewAction> newActionExportableService;
    private final ExportableService<ActionCollection> actionCollectionExportableService;
    private final ExportableServiceCE<Theme> themeExportableService;
    private final ExportableService<CustomJSLib> customJSLibExportableService;
    private final CustomJSLibService customJSLibService;
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
        return applicationService
                .findById(applicationId, permission)
                .flatMap(application -> {
                    if (params.containsKey(FieldName.CUSTOM_JS_LIB_LIST)) {
                        return exportFilteredCustomJSLib(
                                applicationId, Set.copyOf(params.get(FieldName.CUSTOM_JS_LIB_LIST)), applicationJson);
                    }
                    return Mono.just(applicationJson);
                }) /*
                   .flatMap(o -> {
                       if (params.containsKey(FieldName.ACTION_ID)) {
                           // export actions
                       }
                       if (params.containsKey(FieldName.DATASOURCE_ID)) {
                           // export datasource
                       }
                       if (params.containsKey(FieldName.ACTION_COLLECTION_LIST)) {
                           // export js objects
                       }
                   })*/
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
}
