package com.appsmith.server.exports.exportable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public interface ExportableServiceCE<T extends BaseDomain> {

    Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends ExportableArtifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    default Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends ExportableArtifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            Boolean isContextAgnostic) {
        return Mono.empty();
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
            MappedExportableResourcesDTO mappedExportableResourcesDTO, List<T> entityList) {
        return new HashSet<>();
    }
}
