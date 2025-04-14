package com.appsmith.server.exports.internal.artifactbased;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ArtifactBasedExportServiceCE<T extends Artifact, U extends ArtifactExchangeJson> {

    U createNewArtifactExchangeJson();

    AclPermission getArtifactExportPermission(Boolean isGitSync, Boolean exportWithConfiguration);

    Mono<T> findExistingArtifactByIdAndBranchName(String artifactId, String branchName, AclPermission aclPermission);

    Mono<T> findExistingArtifactForAnalytics(String artifactId);

    Mono<Void> getArtifactReadyForExport(
            Artifact exportableArtifact, ArtifactExchangeJson artifactExchangeJson, ExportingMetaDTO exportingMetaDTO);

    Map<String, Object> getExportRelatedArtifactData(ArtifactExchangeJson artifactExchangeJson);

    Map<String, String> getConstantsMap();

    void sanitizeArtifactSpecificExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseArtifactObjective);

    Flux<Void> generateArtifactSpecificExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    Flux<Void> generateArtifactComponentDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    Flux<Void> updateArtifactComponentDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);
}
