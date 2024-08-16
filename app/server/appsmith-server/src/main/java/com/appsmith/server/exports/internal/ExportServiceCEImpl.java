package com.appsmith.server.exports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.internal.artifactbased.ArtifactBasedExportService;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.ARTIFACT_CONTEXT;
import static java.lang.Boolean.TRUE;

@Slf4j
public class ExportServiceCEImpl implements ExportServiceCE {

    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final WorkspaceService workspaceService;
    private final ArtifactBasedExportService<Application, ApplicationJson> applicationExportService;
    private final ExportableService<Datasource> datasourceExportableService;
    private final ExportableService<Plugin> pluginExportableService;
    private final ExportableService<CustomJSLib> customJSLibExportableService;
    protected final Gson gson;
    private final JsonSchemaVersions jsonSchemaVersions;

    public ExportServiceCEImpl(
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ArtifactBasedExportService<Application, ApplicationJson> applicationExportService,
            WorkspaceService workspaceService,
            Gson gson,
            ExportableService<Datasource> datasourceExportableService,
            ExportableService<Plugin> pluginExportableService,
            ExportableService<CustomJSLib> customJSLibExportableService,
            JsonSchemaVersions jsonSchemaVersions) {
        this.sessionUserService = sessionUserService;
        this.analyticsService = analyticsService;
        this.workspaceService = workspaceService;
        this.gson = gson;
        this.applicationExportService = applicationExportService;
        this.datasourceExportableService = datasourceExportableService;
        this.pluginExportableService = pluginExportableService;
        this.customJSLibExportableService = customJSLibExportableService;
        this.jsonSchemaVersions = jsonSchemaVersions;
    }

    @Override
    public ArtifactBasedExportService<?, ?> getContextBasedExportService(@NonNull ArtifactType artifactType) {
        return switch (artifactType) {
            case APPLICATION -> applicationExportService;
            default -> applicationExportService;
        };
    }

    @Override
    public Mono<? extends ArtifactExchangeJson> exportByExportableArtifactIdAndBranchName(
            String artifactId, String branchName, SerialiseArtifactObjective objective, ArtifactType artifactType) {

        // We require this to be present, without this we can't move further ahead
        if (artifactType == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ARTIFACT_CONTEXT));
        }

        ArtifactBasedExportService<?, ?> artifactBasedExportService = getContextBasedExportService(artifactType);
        Map<String, String> artifactContextConstantMap = artifactBasedExportService.getConstantsMap();
        String idConstant = artifactContextConstantMap.get(FieldName.ID);

        if (!StringUtils.hasText(artifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, idConstant));
        }

        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.EXPORT.getEventName());

        boolean exportWithConfiguration = false;

        /*
         since we are merging the method exportByArtifactIdAndBranchName to one method for performance reasons
         this step is required for test cases and TemplateServices
        */
        SerialiseArtifactObjective serialiseArtifactObjective =
                objective == null ? SerialiseArtifactObjective.SHARE : objective;

        boolean isGitSync = SerialiseArtifactObjective.VERSION_CONTROL.equals(serialiseArtifactObjective);

        // We need edit permission for git-related tasks, otherwise export permissions are required
        AclPermission permission =
                artifactBasedExportService.getArtifactExportPermission(isGitSync, exportWithConfiguration);

        final MappedExportableResourcesDTO mappedResourcesDTO = new MappedExportableResourcesDTO();
        final ExportingMetaDTO exportingMetaDTO = new ExportingMetaDTO();

        ArtifactExchangeJson artifactExchangeJson = artifactBasedExportService.createNewArtifactExchangeJson();
        // Set json schema version which will be used to check the compatibility while importing the JSON
        artifactExchangeJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        artifactExchangeJson.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());

        // Find the transaction artifact with appropriate permission
        Mono<? extends Artifact> exportableArtifactMono = artifactBasedExportService
                .findExistingArtifactByIdAndBranchName(artifactId, null, permission)
                .map(transactionArtifact -> {
                    // Since we have moved the setting of artifactId from the repository, the MetaDTO needs to assigned
                    // from here
                    exportingMetaDTO.setArtifactType(artifactContextConstantMap.get(ARTIFACT_CONTEXT));
                    exportingMetaDTO.setArtifactId(transactionArtifact.getId());
                    exportingMetaDTO.setBranchName(null);
                    exportingMetaDTO.setIsGitSync(isGitSync);
                    exportingMetaDTO.setExportWithConfiguration(exportWithConfiguration);

                    if (!TRUE.equals(transactionArtifact.getExportWithConfiguration())) {
                        // Explicitly setting the boolean to avoid NPE for future checks
                        transactionArtifact.setExportWithConfiguration(false);
                    }
                    exportingMetaDTO.setExportWithConfiguration(transactionArtifact.getExportWithConfiguration());
                    return transactionArtifact;
                })
                .cache();

        return exportableArtifactMono
                .flatMap(exportableArtifact -> {
                    // Refactor exportableArtifact to remove the ids
                    // TODO rename the method
                    return artifactBasedExportService
                            .getArtifactReadyForExport(exportableArtifact, artifactExchangeJson, exportingMetaDTO)
                            .then(Mono.defer(() -> getExportableEntities(
                                    exportingMetaDTO,
                                    mappedResourcesDTO,
                                    exportableArtifactMono,
                                    artifactExchangeJson)))
                            .then(Mono.defer(() -> sanitizeEntities(
                                    serialiseArtifactObjective,
                                    artifactExchangeJson,
                                    mappedResourcesDTO,
                                    exportingMetaDTO)))
                            .then(Mono.fromCallable(() -> {
                                exportableArtifact.makePristine();
                                exportableArtifact.sanitiseToExportDBObject();
                                // Disable exporting the exportableArtifact with datasource config once imported in
                                // destination instance
                                exportableArtifact.setExportWithConfiguration(null);
                                return artifactExchangeJson;
                            }));
                })
                .then(sessionUserService.getCurrentUser())
                .flatMap(user -> {
                    Map<String, String> contextConstants = artifactBasedExportService.getConstantsMap();
                    stopwatch.stopTimer();
                    final Map<String, Object> data = new HashMap<>();
                    data.put(FieldName.FLOW_NAME, stopwatch.getFlow());
                    data.put("executionTime", stopwatch.getExecutionTime());
                    data.put(contextConstants.get(FieldName.ID), exportingMetaDTO.getArtifactId());
                    data.putAll(artifactBasedExportService.getExportRelatedArtifactData(artifactExchangeJson));
                    return analyticsService
                            .sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), user.getUsername(), data)
                            .thenReturn(artifactExchangeJson);
                })
                .flatMap(unused -> sendExportArtifactAnalyticsEvent(
                        artifactBasedExportService, exportingMetaDTO.getArtifactId(), AnalyticsEvents.EXPORT))
                .thenReturn(artifactExchangeJson);
    }

    protected Mono<Void> sanitizeEntities(
            SerialiseArtifactObjective serialiseFor,
            ArtifactExchangeJson artifactExchangeJson,
            MappedExportableResourcesDTO mappedResourcesDTO,
            ExportingMetaDTO exportingMetaDTO) {

        ArtifactBasedExportService<?, ?> artifactBasedExportService =
                getContextBasedExportService(artifactExchangeJson.getArtifactJsonType());

        datasourceExportableService.sanitizeEntities(
                exportingMetaDTO, mappedResourcesDTO, artifactExchangeJson, serialiseFor, true);

        artifactBasedExportService.sanitizeArtifactSpecificExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, artifactExchangeJson, serialiseFor);

        return Mono.empty();
    }

    private Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ArtifactBasedExportService<?, ?> artifactBasedExportService =
                getContextBasedExportService(artifactExchangeJson.getArtifactJsonType());

        List<Mono<Void>> artifactAgnosticExportedEntities = generateArtifactAgnosticExportables(
                exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson);
        Flux<Void> artifactSpecificExportedEntities = artifactBasedExportService.generateArtifactSpecificExportables(
                exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson);
        Flux<Void> artifactComponentDependentExportedEntities =
                artifactBasedExportService.generateArtifactComponentDependentExportables(
                        exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson);

        // The idea with both these methods is that any amount of overriding should take care of whether they want to
        // zip the additional exportables along with these or sequence them, or combine them using any other logic
        return Flux.merge(artifactAgnosticExportedEntities)
                .thenMany(Flux.merge(artifactSpecificExportedEntities))
                .thenMany(Flux.merge(artifactComponentDependentExportedEntities))
                .then();
    }

    protected List<Mono<Void>> generateArtifactAgnosticExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        // Updates plugin map in exportable resources
        Mono<Void> pluginExportablesMono = pluginExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson, TRUE);

        // Updates datasourceId to name map in exportable resources.
        // Also directly updates required datasources information in artifactExchangeJSON
        Mono<Void> datasourceExportablesMono = datasourceExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson, TRUE);

        // Directly sets required custom JS lib information in artifactExchangeJSON
        Mono<Void> customJsLibsExportablesMono = customJSLibExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson, TRUE);

        return List.of(pluginExportablesMono, datasourceExportablesMono, customJsLibsExportablesMono);
    }

    /**
     * This method is for general export flow of any artifact with default branch with the right artifact-Id.
     * Since we are moving towards unique-id artifacts for Git (under considerations), this would be main method moving forward.
     * @param artifactId : ID of the artifact to be exported
     * @param objective : objective of serialisation, it could be for version-control, sharing, or some other purpose
     * @param artifactType : Type of Artifact.
     * @return A json which extends Artifact exchange json i.e. ApplicationJson
     */
    @Override
    public Mono<? extends ArtifactExchangeJson> exportByArtifactId(
            String artifactId, SerialiseArtifactObjective objective, ArtifactType artifactType) {
        return exportByExportableArtifactIdAndBranchName(artifactId, null, objective, artifactType);
    }

    /**
     * This method is explicitly for exporting applications which is present in different branches.
     * @param artifactId : ID of the artifact to be exported
     * @param branchName : branch name of the artifact in case it's git connected
     * @param artifactType : Type of Artifact.
     * @return A json which extends Artifact exchange json i.e. ApplicationJson
     */
    @Override
    public Mono<? extends ArtifactExchangeJson> exportByArtifactIdAndBranchName(
            String artifactId, String branchName, ArtifactType artifactType) {
        return exportByExportableArtifactIdAndBranchName(
                artifactId, branchName, SerialiseArtifactObjective.SHARE, artifactType);
    }

    public Mono<ExportFileDTO> getArtifactFile(String branchedArtifactId, ArtifactType artifactType) {
        return exportByArtifactId(branchedArtifactId, SerialiseArtifactObjective.SHARE, artifactType)
                .doOnNext(artifactExchangeJson -> artifactExchangeJson.setModifiedResources(null))
                .map(artifactExchangeJson -> {
                    String stringifiedFile = gson.toJson(artifactExchangeJson);
                    String artifactName = artifactExchangeJson.getArtifact().getName();
                    Object jsonObject = gson.fromJson(stringifiedFile, Object.class);
                    HttpHeaders responseHeaders = new HttpHeaders();
                    ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                            .filename(artifactName + ".json", StandardCharsets.UTF_8)
                            .build();
                    responseHeaders.setContentDisposition(contentDisposition);
                    responseHeaders.setContentType(MediaType.APPLICATION_JSON);

                    ExportFileDTO exportFileDTO = new ExportFileDTO();
                    exportFileDTO.setArtifactResource(jsonObject);
                    exportFileDTO.setHttpHeaders(responseHeaders);
                    return exportFileDTO;
                });
    }

    /**
     * To send analytics event for import and export of application
     *
     * @param artifactBasedExportService : A exportService which is an implementation of contextBasedExportService
     * @param exportableArtifactId : String exportableArtifactId
     * @param event : Analytics Event
     * @return a subclass of  which is imported or exported
     */
    private Mono<? extends Artifact> sendExportArtifactAnalyticsEvent(
            ArtifactBasedExportService<?, ?> artifactBasedExportService,
            String exportableArtifactId,
            AnalyticsEvents event) {
        return artifactBasedExportService
                .findExistingArtifactForAnalytics(exportableArtifactId)
                .flatMap(exportableArtifact -> {
                    return workspaceService
                            .getById(exportableArtifact.getWorkspaceId())
                            .flatMap(workspace -> {
                                Map<String, String> contextConstants = artifactBasedExportService.getConstantsMap();
                                final Map<String, Object> data = new HashMap<>();
                                final Map<String, Object> eventData = Map.of(
                                        contextConstants.get(ARTIFACT_CONTEXT),
                                        exportableArtifact,
                                        FieldName.WORKSPACE,
                                        workspace);

                                data.put(FieldName.EVENT_DATA, eventData);
                                data.put(FieldName.WORKSPACE_ID, workspace.getId());
                                data.put(contextConstants.get(FieldName.ID), exportableArtifact.getId());
                                return analyticsService.sendObjectEvent(event, exportableArtifact, data);
                            });
                });
    }
}
