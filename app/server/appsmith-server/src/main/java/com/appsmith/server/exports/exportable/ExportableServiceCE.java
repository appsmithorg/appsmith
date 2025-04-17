package com.appsmith.server.exports.exportable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public interface ExportableServiceCE<T extends BaseDomain> {

    ArtifactBasedExportableService<T, ?> getArtifactBasedExportableService(ExportingMetaDTO exportingMetaDTO);

    default Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return Mono.empty().then();
    }

    default Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            Boolean isContextAgnostic) {
        return Mono.empty();
    }

    default Mono<Void> updateExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return Mono.empty().then();
    }

    default void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor) {}

    default void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor,
            Boolean isContextAgnostic) {}

    default Set<String> mapNameToIdForExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            List<T> entityList) {
        return new HashSet<>();
    }
}
