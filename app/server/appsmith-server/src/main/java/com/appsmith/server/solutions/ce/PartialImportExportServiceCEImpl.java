package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.solutions.*;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class PartialImportExportServiceCEImpl implements PartialImportExportServiceCE {
    private final ImportExportApplicationService importExportApplicationService;
    private final Gson gson;
    private final ApplicationService applicationService;
    private final CustomJSLibService customJSLibService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final DatasourcePermission datasourcePermission;

    private Mono<List<CustomJSLib>> exportFilteredCustomJSLib(String applicationId, Set<String> customJSLibSet) {
        return customJSLibService
                .getAllJSLibsInApplicationForExport(applicationId, null, false)
                .flatMap(customJSLibs -> {
                    List<CustomJSLib> updatedCustomJSLibList = customJSLibs.stream()
                            .filter(customJSLib -> customJSLibSet.contains(customJSLib.getName()))
                            .toList();
                    return Mono.just(updatedCustomJSLibList);
                });
    }

    public Mono<ApplicationJson> exportPartialApplicationById(String applicationId, PartialImportExportDTO entities) {
        ApplicationJson appJson = new ApplicationJson();
        appJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        appJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);
        appJson.setCustomJSLibList(new ArrayList<>());
        appJson.setActionList(new ArrayList<>());
        appJson.setActionCollectionList(new ArrayList<>());
        appJson.setDatasourceList(new ArrayList<>());
        Application tempApp = new Application();
        Set<String> customJSLibSet = new HashSet<>(entities.getCustomJSLibList());
        AclPermission aclPermission = applicationPermission.getExportPermission();
        return applicationService
                .findById(applicationId, aclPermission)
                .flatMap(application -> {
                    tempApp.setName(application.getName());
                    appJson.setExportedApplication(tempApp);
                    return Mono.empty();
                })
                .then(exportFilteredCustomJSLib(applicationId, customJSLibSet).flatMap(customJSLibs -> {
                    appJson.setCustomJSLibList(customJSLibs);
                    return Mono.just(appJson);
                }));
    }

    // TODO: As of now, this function is almost the same as the one in ImportExportServiceCEImpl.
    //  Refactor this to avoid duplication
    public Mono<ExportFileDTO> getPartialApplicationFile(String applicationId, PartialImportExportDTO entities) {
        return exportPartialApplicationById(applicationId, entities).map(applicationJson -> {
            String fileStr = gson.toJson(applicationJson);
            String applicationName = applicationJson.getExportedApplication().getName();
            Object jsonObject = gson.fromJson(fileStr, Object.class);
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

    private Mono<Application> importCustomJsLibs(String applicationId, List<CustomJSLib> customJSLibList) {
        return Flux.fromIterable(customJSLibList)
                .flatMap(customJSLib -> customJSLibService.addJSLibToApplication(applicationId, customJSLib, "", false))
                .then(applicationService.findById(applicationId));
    }

    public Mono<ApplicationImportDTO> importPartialApplicationFromJson(
            String applicationId, String workspaceId, ApplicationJson applicationJson) {
        // Update the application JSON to prepare it for merging inside an existing application
        if (applicationJson.getExportedApplication() != null) {
            // setting some properties to null so that target application is not updated by these properties
            applicationJson.getExportedApplication().setName(null);
            applicationJson.getExportedApplication().setSlug(null);
            applicationJson.getExportedApplication().setForkingEnabled(null);
            applicationJson.getExportedApplication().setForkWithConfiguration(null);
            applicationJson.getExportedApplication().setClonedFromApplicationId(null);
            applicationJson.getExportedApplication().setExportWithConfiguration(null);
        }

        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                    .requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                    .allPermissionsRequired()
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();
            return applicationService
                    .findById(applicationId, permissionProvider.getRequiredPermissionOnTargetApplication())
                    .flatMap(application -> importCustomJsLibs(applicationId, applicationJson.getCustomJSLibList()))
                    .flatMap(application -> applicationService.update(applicationId, application))
                    .flatMap(application -> importExportApplicationService.getApplicationImportDTO(
                            applicationId, workspaceId, application));
        });
    }

    public Mono<ApplicationImportDTO> importPartialApplicationFromFile(
            String applicationId, String workspaceId, String pageId, Part importedDoc) {
        return DataBufferUtils.join(importedDoc.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                })
                .flatMap(jsonString -> {
                    Type fileType = new TypeToken<ApplicationJson>() {}.getType();
                    ApplicationJson applicationJson = gson.fromJson(jsonString, fileType);
                    return importPartialApplicationFromJson(applicationId, workspaceId, applicationJson);
                });
    }
}
