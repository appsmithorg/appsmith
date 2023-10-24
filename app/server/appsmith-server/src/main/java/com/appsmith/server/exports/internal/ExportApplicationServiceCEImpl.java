package com.appsmith.server.exports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitApplicationMetadata;
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
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class ExportApplicationServiceCEImpl implements ExportApplicationServiceCE {

    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final AnalyticsService analyticsService;
    private final ApplicationPermission applicationPermission;
    private final Gson gson;
    private final ExportableService<Datasource> datasourceExportableService;
    private final ExportableService<Plugin> pluginExportableService;
    private final ExportableService<NewPage> newPageExportableService;
    private final ExportableService<NewAction> newActionExportableService;
    private final ExportableService<ActionCollection> actionCollectionExportableService;
    private final ExportableService<Theme> themeExportableService;
    private final ExportableService<CustomJSLib> customJSLibExportableService;

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(
            String applicationId, SerialiseApplicationObjective serialiseFor) {

        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.EXPORT.getEventName());
        /*
           1. Fetch application by id
           2. Fetch pages from the application
           3. Fetch datasources from workspace
           4. Fetch actions from the application
           5. Filter out relevant datasources using actions reference
           6. Fetch action collections from the application
        */
        ApplicationJson applicationJson = new ApplicationJson();
        final MappedExportableResourcesDTO mappedResourcesDTO = new MappedExportableResourcesDTO();
        final ExportingMetaDTO exportingMetaDTO = new ExportingMetaDTO();
        exportingMetaDTO.setApplicationId(applicationId);
        exportingMetaDTO.setBranchName(null);

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        boolean isGitSync = SerialiseApplicationObjective.VERSION_CONTROL.equals(serialiseFor)
                || SerialiseApplicationObjective.KNOWLEDGE_BASE_GENERATION.equals(serialiseFor);
        exportingMetaDTO.setIsGitSync(isGitSync);
        exportingMetaDTO.setExportWithConfiguration(false);

        AclPermission permission =
                applicationPermission.getExportPermission(isGitSync, exportingMetaDTO.getExportWithConfiguration());

        Mono<Application> applicationMono =
                // Find the application with appropriate permission
                applicationService
                        .findById(applicationId, permission)
                        // Find the application without permissions if it is a template application
                        .switchIfEmpty(Mono.defer(
                                () -> applicationService.findByIdAndExportWithConfiguration(applicationId, TRUE)))
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)))
                        .map(application -> {
                            if (!TRUE.equals(application.getExportWithConfiguration())) {
                                // Explicitly setting the boolean to avoid NPE for future checks
                                application.setExportWithConfiguration(false);
                            }
                            exportingMetaDTO.setExportWithConfiguration(application.getExportWithConfiguration());
                            return application;
                        })
                        .cache();

        // Set json schema version which will be used to check the compatibility while importing the JSON
        applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

        return applicationMono
                .flatMap(application -> {
                    // Refactor application to remove the ids
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Instant applicationLastCommittedAt =
                            gitApplicationMetadata != null ? gitApplicationMetadata.getLastCommittedAt() : null;
                    boolean isClientSchemaMigrated =
                            !JsonSchemaVersions.clientVersion.equals(application.getClientSchemaVersion());
                    boolean isServerSchemaMigrated =
                            !JsonSchemaVersions.serverVersion.equals(application.getServerSchemaVersion());
                    exportingMetaDTO.setApplicationLastCommittedAt(applicationLastCommittedAt);
                    exportingMetaDTO.setClientSchemaMigrated(isClientSchemaMigrated);
                    exportingMetaDTO.setServerSchemaMigrated(isServerSchemaMigrated);
                    applicationJson.setExportedApplication(application);

                    List<String> unpublishedPages = application.getPages().stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());

                    exportingMetaDTO.setUnpublishedPages(unpublishedPages);

                    return pluginExportableService
                            .getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson)
                            .then(themeExportableService.getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                            .then(newPageExportableService.getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                            .then(datasourceExportableService.getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                            .then(actionCollectionExportableService.getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                            .then(newActionExportableService.getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                            .then(customJSLibExportableService.getExportableEntities(
                                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                            .map(newActions -> {
                                datasourceExportableService.sanitizeEntities(
                                        exportingMetaDTO, mappedResourcesDTO, applicationJson, serialiseFor);

                                newPageExportableService.sanitizeEntities(
                                        exportingMetaDTO, mappedResourcesDTO, applicationJson, serialiseFor);

                                application.makePristine();
                                application.sanitiseToExportDBObject();
                                // Disable exporting the application with datasource config once imported in destination
                                // instance
                                application.setExportWithConfiguration(null);
                                return applicationJson;
                            });
                })
                .then(sessionUserService.getCurrentUser())
                .map(user -> {
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID,
                            applicationId,
                            "pageCount",
                            applicationJson.getPageList().size(),
                            "actionCount",
                            applicationJson.getActionList().size(),
                            "JSObjectCount",
                            applicationJson.getActionCollectionList().size(),
                            FieldName.FLOW_NAME,
                            stopwatch.getFlow(),
                            "executionTime",
                            stopwatch.getExecutionTime());
                    analyticsService.sendEvent(
                            AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), user.getUsername(), data);
                    return applicationJson;
                })
                .then(applicationMono)
                .map(application -> sendImportExportApplicationAnalyticsEvent(application, AnalyticsEvents.EXPORT))
                .thenReturn(applicationJson);
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getExportPermission())
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    public Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName) {
        return this.exportApplicationById(applicationId, branchName).map(applicationJson -> {
            String stringifiedFile = gson.toJson(applicationJson);
            String applicationName = applicationJson.getExportedApplication().getName();
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

    /**
     * To send analytics event for import and export of application
     *
     * @param application Application object imported or exported
     * @param event       AnalyticsEvents event
     * @return The application which is imported or exported
     */
    private Mono<Application> sendImportExportApplicationAnalyticsEvent(
            Application application, AnalyticsEvents event) {
        return workspaceService.getById(application.getWorkspaceId()).flatMap(workspace -> {
            final Map<String, Object> eventData = Map.of(
                    FieldName.APPLICATION, application,
                    FieldName.WORKSPACE, workspace);

            final Map<String, Object> data = Map.of(
                    FieldName.APPLICATION_ID, application.getId(),
                    FieldName.WORKSPACE_ID, workspace.getId(),
                    FieldName.EVENT_DATA, eventData);

            return analyticsService.sendObjectEvent(event, application, data);
        });
    }
}
