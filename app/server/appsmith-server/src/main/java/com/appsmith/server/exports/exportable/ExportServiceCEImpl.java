package com.appsmith.server.exports.exportable;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.exports.ApplicationExportService;
import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.TransactionalArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ContextBasedExportService;
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

import static java.lang.Boolean.TRUE;

@Slf4j
public class ExportServiceCEImpl implements ExportServiceCE {

    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final WorkspaceService workspaceService;
    private final ApplicationExportService applicationExportService;
    private final Map<ArtifactJsonType, ContextBasedExportService<?, ?>> contextBasedExportServiceMap = new HashMap<>();
    private final ExportableService<Datasource> datasourceExportableService;
    private final ExportableService<Plugin> pluginExportableService;
    private final ExportableService<CustomJSLib> customJSLibExportableService;
    protected final Gson gson;

    public ExportServiceCEImpl(
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ApplicationExportService applicationExportService,
            WorkspaceService workspaceService,
            ExportableService<Datasource> datasourceExportableService,
            ExportableService<Plugin> pluginExportableService,
            ExportableService<CustomJSLib> customJSLibExportableService) {
        this.sessionUserService = sessionUserService;
        this.analyticsService = analyticsService;
        this.workspaceService = workspaceService;
        this.applicationExportService = applicationExportService;
        this.datasourceExportableService = datasourceExportableService;
        this.pluginExportableService = pluginExportableService;
        this.customJSLibExportableService = customJSLibExportableService;
        // Needs further analysis for requirement of a gson builder
        this.gson = new Gson();
        this.contextBasedExportServiceMap.put(ArtifactJsonType.APPLICATION, this.applicationExportService);
    }

    @Override
    public ContextBasedExportService<?, ?> getContextBasedExportService(@NonNull ArtifactJsonType artifactJsonType) {
        return contextBasedExportServiceMap.get(artifactJsonType);
    }

    @Override
    public Mono<? extends ArtifactExchangeJson> exportByTransactionalArtifactIdAndBranchName(
            String artifactId,
            String branchName,
            SerialiseArtifactObjective objective,
            ArtifactJsonType artifactJsonType) {

        // We require this to be present, without this we can't move further ahead
        if (artifactJsonType == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_CONTEXT));
        }

        ContextBasedExportService<?, ?> contextBasedExportService = getContextBasedExportService(artifactJsonType);
        Map<String, String> artifactContextConstantMap = contextBasedExportService.getConstantsMap();
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
        // TODO: change the serialisation class
        SerialiseArtifactObjective serialiseArtifactObjective =
                objective == null ? SerialiseArtifactObjective.SHARE : objective;

        boolean isGitSync = SerialiseArtifactObjective.VERSION_CONTROL.equals(serialiseArtifactObjective)
                || SerialiseArtifactObjective.KNOWLEDGE_BASE_GENERATION.equals(serialiseArtifactObjective);

        // We need edit permission for git-related tasks, otherwise export permissions are required
        AclPermission permission =
                contextBasedExportService.getArtifactExportPermission(isGitSync, exportWithConfiguration);

        final MappedExportableResourcesDTO mappedResourcesDTO = new MappedExportableResourcesDTO();
        final ExportingMetaDTO exportingMetaDTO = new ExportingMetaDTO();

        ArtifactExchangeJson artifactExchangeJson = contextBasedExportService.createNewArtifactExchangeJson();
        // Set json schema version which will be used to check the compatibility while importing the JSON
        artifactExchangeJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        artifactExchangeJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

        // Find the transaction artifact with appropriate permission
        Mono<? extends TransactionalArtifact> transactionalArtifactMono = contextBasedExportService
                .findExistingArtifactByIdAndBranchName(artifactId, branchName, permission)
                .map(transactionArtifact -> {
                    // Since we have moved the setting of artifactId from the repository, the MetaDTO needs to assigned
                    // from here
                    exportingMetaDTO.setApplicationId(transactionArtifact.getId());
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

        return transactionalArtifactMono
                .flatMap(transactionalArtifact -> {
                    // Refactor transactionalArtifact to remove the ids
                    // TODO rename the method
                    contextBasedExportService.getArtifactReadyForExport(
                            transactionalArtifact, artifactExchangeJson, exportingMetaDTO);
                    return getExportableEntities(
                                    exportingMetaDTO,
                                    mappedResourcesDTO,
                                    transactionalArtifactMono,
                                    artifactExchangeJson)
                            .then(Mono.defer(() -> sanitizeEntities(
                                    serialiseArtifactObjective,
                                    artifactExchangeJson,
                                    mappedResourcesDTO,
                                    exportingMetaDTO)))
                            .then(Mono.fromCallable(() -> {
                                transactionalArtifact.makePristine();
                                transactionalArtifact.sanitiseToExportDBObject();
                                // Disable exporting the transactionalArtifact with datasource config once imported in
                                // destination
                                // instance
                                transactionalArtifact.setExportWithConfiguration(null);
                                return artifactExchangeJson;
                            }));
                })
                .then(sessionUserService.getCurrentUser())
                .flatMap(user -> {
                    Map<String, String> contextConstants = contextBasedExportService.getConstantsMap();
                    stopwatch.stopTimer();
                    final Map<String, Object> data = new HashMap<>();
                    data.put(FieldName.FLOW_NAME, stopwatch.getFlow());
                    data.put("executionTime", stopwatch.getExecutionTime());
                    data.put(contextConstants.get(FieldName.ID), exportingMetaDTO.getApplicationId());
                    data.putAll(contextBasedExportService.getExportRelatedArtifactData(artifactExchangeJson));
                    return analyticsService
                            .sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), user.getUsername(), data)
                            .thenReturn(artifactExchangeJson);
                })
                .flatMap(unused -> sendExportArtifactAnalyticsEvent(
                        contextBasedExportService, exportingMetaDTO.getApplicationId(), AnalyticsEvents.EXPORT))
                .thenReturn(artifactExchangeJson);
    }

    protected Mono<Void> sanitizeEntities(
            SerialiseArtifactObjective serialiseFor,
            ArtifactExchangeJson artifactExchangeJson,
            MappedExportableResourcesDTO mappedResourcesDTO,
            ExportingMetaDTO exportingMetaDTO) {

        ContextBasedExportService<?, ?> contextBasedExportService =
                getContextBasedExportService(artifactExchangeJson.getArtifactJsonType());

        datasourceExportableService.sanitizeEntities(
                exportingMetaDTO, mappedResourcesDTO, artifactExchangeJson, serialiseFor, true);

        contextBasedExportService.sanitizeArtifactSpecificExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, artifactExchangeJson, serialiseFor);

        return Mono.empty().then();
    }

    private Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends TransactionalArtifact> transactionalArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ContextBasedExportService<?, ?> contextBasedExportService =
                getContextBasedExportService(artifactExchangeJson.getArtifactJsonType());

        List<Mono<Void>> artifactAgnosticExportedEntities = generateArtifactAgnosticExportables(
                exportingMetaDTO, mappedResourcesDTO, transactionalArtifactMono, artifactExchangeJson);
        Flux<Void> artifactSpecificExportedEntities = contextBasedExportService.generateArtifactSpecificExportables(
                exportingMetaDTO, mappedResourcesDTO, transactionalArtifactMono, artifactExchangeJson);
        Flux<Void> artifactComponentDependentExportedEntities =
                contextBasedExportService.generateArtifactComponentDependentExportables(
                        exportingMetaDTO, mappedResourcesDTO, transactionalArtifactMono, artifactExchangeJson);

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
            Mono<? extends TransactionalArtifact> transactionalArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        // Updates plugin map in exportable resources
        Mono<Void> pluginExportablesMono = pluginExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, transactionalArtifactMono, artifactExchangeJson, TRUE);

        // Updates datasourceId to name map in exportable resources.
        // Also directly updates required datasources information in artifactExchangeJSON
        Mono<Void> datasourceExportablesMono = datasourceExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, transactionalArtifactMono, artifactExchangeJson, TRUE);

        // Directly sets required custom JS lib information in artifactExchangeJSON
        Mono<Void> customJsLibsExportablesMono = customJSLibExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, transactionalArtifactMono, artifactExchangeJson, TRUE);

        return List.of(pluginExportablesMono, datasourceExportablesMono, customJsLibsExportablesMono);
    }

    /**
     * This method is for general export flow of any artifact with default branch with the right artifact-Id.
     * Since we are moving towards unique-id artifacts for Git (under considerations), this would be main method moving forward.
     * @param artifactId : ID of the artifact to be exported
     * @param objective : objective of serialisation, it could be for version-control, sharing, or some other purpose
     * @param artifactJsonType : Type of Artifact.
     * @return A json which extends Artifact exchange json i.e. ApplicationJson
     */
    @Override
    public Mono<? extends ArtifactExchangeJson> exportByArtifactId(
            String artifactId, SerialiseArtifactObjective objective, ArtifactJsonType artifactJsonType) {
        return exportByTransactionalArtifactIdAndBranchName(artifactId, null, objective, artifactJsonType);
    }

    /**
     * This method is explicitly for exporting applications which is present in different branches.
     * @param artifactId : ID of the artifact to be exported
     * @param branchName : branch name of the artifact in case it's git connected
     * @param artifactJsonType : Type of Artifact.
     * @return A json which extends Artifact exchange json i.e. ApplicationJson
     */
    @Override
    public Mono<? extends ArtifactExchangeJson> exportByArtifactIdAndBranchName(
            String artifactId, String branchName, ArtifactJsonType artifactJsonType) {
        return exportByTransactionalArtifactIdAndBranchName(
                artifactId, branchName, SerialiseArtifactObjective.SHARE, artifactJsonType);
    }

    public Mono<ExportFileDTO> getArtifactFile(
            String artifactId, String branchName, ArtifactJsonType artifactJsonType) {
        return exportByArtifactIdAndBranchName(artifactId, branchName, artifactJsonType)
                .map(artifactExchangeJson -> {
                    String stringifiedFile = gson.toJson(artifactExchangeJson);
                    String applicationName =
                            artifactExchangeJson.getTransactionalArtifact().getName();
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
     * @param contextBasedExportService : A exportService which is an implementation of contextBasedExportService
     * @param transactionalArtifactId : String transactionalArtifactId
     * @param event : Analytics Event
     * @return a subclass of  which is imported or exported
     */
    private Mono<? extends TransactionalArtifact> sendExportArtifactAnalyticsEvent(
            ContextBasedExportService<?, ?> contextBasedExportService,
            String transactionalArtifactId,
            AnalyticsEvents event) {
        return contextBasedExportService
                .findExistingArtifactForAnalytics(transactionalArtifactId)
                .flatMap(transactionalArtifact -> {
                    return workspaceService
                            .getById(transactionalArtifact.getWorkspaceId())
                            .flatMap(workspace -> {
                                Map<String, String> contextConstants = contextBasedExportService.getConstantsMap();
                                final Map<String, Object> data = new HashMap<>();
                                final Map<String, Object> eventData = Map.of(
                                        contextConstants.get(FieldName.ARTIFACT_CONTEXT),
                                        transactionalArtifact,
                                        FieldName.WORKSPACE,
                                        workspace);

                                data.put(FieldName.EVENT_DATA, eventData);
                                data.put(FieldName.WORKSPACE_ID, workspace.getId());
                                data.put(contextConstants.get(FieldName.ID), transactionalArtifact.getId());
                                return analyticsService.sendObjectEvent(event, transactionalArtifact, data);
                            });
                });
    }
}
