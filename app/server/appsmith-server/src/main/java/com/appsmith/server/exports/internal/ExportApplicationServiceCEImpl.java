package com.appsmith.server.exports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
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
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
                    applicationJson.setUpdatedResources(new ConcurrentHashMap<>());

                    List<String> unpublishedPages = application.getPages().stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());

                    exportingMetaDTO.setUnpublishedPages(unpublishedPages);

                    return getExportableEntities(exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson)
                            .then(Mono.defer(() -> sanitizeEntities(
                                    serialiseFor, applicationJson, mappedResourcesDTO, exportingMetaDTO)))
                            .then(Mono.fromCallable(() -> {
                                application.makePristine();
                                application.sanitiseToExportDBObject();
                                // Disable exporting the application with datasource config once imported in destination
                                // instance
                                application.setExportWithConfiguration(null);
                                return applicationJson;
                            }));
                })
                .then(sessionUserService.getCurrentUser())
                .flatMap(user -> {
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
                    return analyticsService
                            .sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), user.getUsername(), data)
                            .thenReturn(applicationJson);
                })
                .flatMap(unused -> sendImportExportApplicationAnalyticsEvent(applicationId, AnalyticsEvents.EXPORT))
                .thenReturn(applicationJson);
    }

    private Mono<Void> sanitizeEntities(
            SerialiseApplicationObjective serialiseFor,
            ApplicationJson applicationJson,
            MappedExportableResourcesDTO mappedResourcesDTO,
            ExportingMetaDTO exportingMetaDTO) {
        datasourceExportableService.sanitizeEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationJson, serialiseFor);

        newPageExportableService.sanitizeEntities(exportingMetaDTO, mappedResourcesDTO, applicationJson, serialiseFor);

        return Mono.empty().then();
    }

    private Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        // The idea with both these methods is that any amount of overriding should take care of whether they want to
        // zip the additional exportables along with these or sequence them, or combine them using any other logic
        return Flux.merge(getPageIndependentExportables(
                        exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson))
                .thenMany(Flux.merge(getPageDependentExportables(
                        exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson)))
                .then();
    }

    protected List<Mono<Void>> getPageIndependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {
        // Updates plugin map in exportable resources
        Mono<Void> pluginExportablesMono = pluginExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        // Directly updates required theme information in application json
        Mono<Void> themeExportablesMono = themeExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        // Updates pageId to name map in exportable resources.
        // Also directly updates required pages information in application json
        Mono<Void> newPageExportablesMono = newPageExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        // Updates datasourceId to name map in exportable resources.
        // Also directly updates required datasources information in application json
        Mono<Void> datasourceExportablesMono = datasourceExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        // Directly sets required custom JS lib information in application JSON
        Mono<Void> customJsLibsExportablesMono = customJSLibExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        return List.of(
                pluginExportablesMono,
                datasourceExportablesMono,
                themeExportablesMono,
                newPageExportablesMono,
                customJsLibsExportablesMono);
    }

    protected List<Mono<Void>> getPageDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        // Requires pageIdToNameMap, pluginMap.
        // Updates collectionId to name map in exportable resources.
        // Also directly updates required collection information in application json
        Mono<Void> actionCollectionExportablesMono = actionCollectionExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        // Requires datasourceIdToNameMap, pageIdToNameMap, pluginMap, collectionIdToNameMap
        // Updates actionId to name map in exportable resources.
        // Also directly updates required collection information in application json
        Mono<Void> newActionExportablesMono = newActionExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        Mono<Void> combinedActionExportablesMono = actionCollectionExportablesMono.then(newActionExportablesMono);

        return List.of(combinedActionExportablesMono);
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
     * @param applicationId String application id
     * @param event       AnalyticsEvents event
     * @return The application which is imported or exported
     */
    private Mono<Application> sendImportExportApplicationAnalyticsEvent(String applicationId, AnalyticsEvents event) {
        return applicationService.findById(applicationId).flatMap(application -> workspaceService
                .getById(application.getWorkspaceId())
                .flatMap(workspace -> {
                    final Map<String, Object> eventData = Map.of(
                            FieldName.APPLICATION, application,
                            FieldName.WORKSPACE, workspace);

                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, application.getId(),
                            FieldName.WORKSPACE_ID, workspace.getId(),
                            FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendObjectEvent(event, application, data);
                }));
    }
}
