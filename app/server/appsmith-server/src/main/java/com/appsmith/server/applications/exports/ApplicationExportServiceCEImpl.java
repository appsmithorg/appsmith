package com.appsmith.server.applications.exports;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.internal.artifactbased.ArtifactBasedExportServiceCE;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@Slf4j
public class ApplicationExportServiceCEImpl implements ArtifactBasedExportServiceCE<Application, ApplicationJson> {

    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final ExportableService<NewPage> newPageExportableService;
    protected final ExportableService<NewAction> newActionExportableService;
    protected final ExportableService<ActionCollection> actionCollectionExportableService;
    private final ExportableService<Theme> themeExportableService;
    private final Map<String, String> applicationConstantsMap = new HashMap<>();
    private final JsonSchemaVersions jsonSchemaVersions;

    public ApplicationExportServiceCEImpl(
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ExportableService<NewPage> newPageExportableService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ExportableService<Theme> themeExportableService,
            JsonSchemaVersions jsonSchemaVersions) {
        this.applicationService = applicationService;
        this.newPageExportableService = newPageExportableService;
        this.newActionExportableService = newActionExportableService;
        this.actionCollectionExportableService = actionCollectionExportableService;
        this.themeExportableService = themeExportableService;
        this.applicationPermission = applicationPermission;
        this.jsonSchemaVersions = jsonSchemaVersions;
        applicationConstantsMap.putAll(
                Map.of(FieldName.ARTIFACT_CONTEXT, FieldName.APPLICATION, FieldName.ID, FieldName.APPLICATION_ID));
    }

    @Override
    public ApplicationJson createNewArtifactExchangeJson() {
        return new ApplicationJson();
    }

    @Override
    public AclPermission getArtifactExportPermission(Boolean isGitSync, Boolean exportWithConfiguration) {
        return applicationPermission.getExportPermission(isGitSync, exportWithConfiguration);
    }

    @Override
    public Mono<Application> findExistingArtifactByIdAndBranchName(
            String artifactId, String branchName, AclPermission aclPermission) {

        if (StringUtils.hasText(branchName)) {
            return applicationService.findByBranchNameAndBaseApplicationId(branchName, artifactId, aclPermission);
        }

        // find the application with appropriate permission
        return applicationService
                .findById(artifactId, aclPermission)
                // Find the application without permissions if it is a template application
                .switchIfEmpty(
                        Mono.defer(() -> applicationService.findByIdAndExportWithConfiguration(artifactId, TRUE)))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, artifactId)));
    }

    @Override
    public Mono<Application> findExistingArtifactForAnalytics(String artifactId) {
        return applicationService.findById(artifactId);
    }

    @Override
    public Map<String, Object> getExportRelatedArtifactData(ArtifactExchangeJson artifactExchangeJson) {

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        return Map.of(
                "pageCount",
                applicationJson.getPageList().size(),
                "actionCount",
                applicationJson.getActionList().size(),
                "JSObjectCount",
                applicationJson.getActionCollectionList().size());
    }

    @Override
    public Mono<Void> getArtifactReadyForExport(
            Artifact exportableArtifact, ArtifactExchangeJson artifactExchangeJson, ExportingMetaDTO exportingMetaDTO) {

        Application application = (Application) exportableArtifact;
        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

        GitArtifactMetadata gitArtifactMetadata = application.getGitApplicationMetadata();
        Instant applicationLastCommittedAt =
                gitArtifactMetadata != null ? gitArtifactMetadata.getLastCommittedAt() : null;
        boolean isClientSchemaMigrated =
                !jsonSchemaVersions.getClientVersion().equals(application.getClientSchemaVersion());
        boolean isServerSchemaMigrated =
                !jsonSchemaVersions.getServerVersion().equals(application.getServerSchemaVersion());

        exportingMetaDTO.setArtifactLastCommittedAt(applicationLastCommittedAt);
        exportingMetaDTO.setClientSchemaMigrated(isClientSchemaMigrated);
        exportingMetaDTO.setServerSchemaMigrated(isServerSchemaMigrated);
        applicationJson.setExportedApplication(application);
        applicationJson.setModifiedResources(new ModifiedResources());

        List<String> unpublishedPages =
                application.getPages().stream().map(ApplicationPage::getId).collect(Collectors.toList());

        exportingMetaDTO.setUnpublishedContextIds(unpublishedPages);

        return Mono.empty().then();
    }

    @Override
    public Map<String, String> getConstantsMap() {
        return applicationConstantsMap;
    }

    @Override
    public void sanitizeArtifactSpecificExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseArtifactObjective) {
        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        newPageExportableService.sanitizeEntities(
                exportingMetaDTO, mappedExportableResourcesDTO, applicationJson, serialiseArtifactObjective);
    }

    @Override
    public Flux<Void> generateArtifactSpecificExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return exportableArtifactMono.flatMapMany(exportableArtifact -> {
            Mono<Application> applicationMono = Mono.just((Application) exportableArtifact);
            ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

            // Directly updates required theme information in application json
            Mono<Void> themeExportablesMono = themeExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

            // Updates pageId to name map in exportable resources.
            // Also directly updates required pages information in application json
            Mono<Void> newPageExportablesMono = newPageExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

            return Flux.merge(newPageExportablesMono, themeExportablesMono);
        });
    }

    @Override
    public Flux<Void> generateArtifactComponentDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return exportableArtifactMono.flatMapMany(exportableArtifact -> {
            Mono<Application> applicationMono = Mono.just((Application) exportableArtifact);
            ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

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

            return combinedActionExportablesMono.flux();
        });
    }
}
