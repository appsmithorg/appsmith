package com.appsmith.server.applications.exports;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.internal.artifactbased.ArtifactBasedExportService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class ApplicationExportServiceImpl extends ApplicationExportServiceCEImpl
        implements ArtifactBasedExportService<Application, ApplicationJson> {

    private final ExportableService<ModuleInstance> moduleInstanceExportableService;

    public ApplicationExportServiceImpl(
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ExportableService<NewPage> newPageExportableService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ExportableService<Theme> themeExportableService,
            ExportableService<ModuleInstance> moduleInstanceExportableService) {

        super(
                applicationService,
                applicationPermission,
                newPageExportableService,
                newActionExportableService,
                actionCollectionExportableService,
                themeExportableService);
        this.moduleInstanceExportableService = moduleInstanceExportableService;
    }

    @Override
    public void sanitizeArtifactSpecificExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseArtifactObjective) {

        super.sanitizeArtifactSpecificExportableEntities(
                exportingMetaDTO, mappedExportableResourcesDTO, artifactExchangeJson, serialiseArtifactObjective);

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        newActionExportableService.sanitizeEntities(
                exportingMetaDTO, mappedExportableResourcesDTO, applicationJson, serialiseArtifactObjective);
        actionCollectionExportableService.sanitizeEntities(
                exportingMetaDTO, mappedExportableResourcesDTO, applicationJson, serialiseArtifactObjective);
    }

    @Override
    public Flux<Void> generateArtifactSpecificExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        Flux<Void> artifactSpecificExportableCE = super.generateArtifactSpecificExportables(
                exportingMetaDTO, mappedResourcesDTO, exportableArtifactMono, artifactExchangeJson);

        Mono<Void> artifactSpecificExportableEE = exportableArtifactMono.flatMap(exportableArtifact -> {
            Mono<Application> applicationMono = Mono.just((Application) exportableArtifact);
            ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

            // Requires pageIdToNameMap
            // Updates moduleInstanceId to name map in exportable resources.
            // Also directly updates required module instance information in application json
            return moduleInstanceExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);
        });

        return Flux.concat(artifactSpecificExportableCE, artifactSpecificExportableEE);
    }
}
