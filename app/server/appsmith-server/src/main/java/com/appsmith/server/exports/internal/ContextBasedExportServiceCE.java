package com.appsmith.server.exports.internal;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ContextBasedExportServiceCE<T extends ExportableArtifact, U extends ArtifactExchangeJson> {

    U createNewArtifactExchangeJson();

    AclPermission getArtifactExportPermission(Boolean isGitSync, Boolean exportWithConfiguration);

    Mono<T> findExistingArtifactByIdAndBranchName(String artifactId, String branchName, AclPermission aclPermission);

    Mono<T> findExistingArtifactForAnalytics(String artifactId);

    void getArtifactReadyForExport(
            ExportableArtifact transactionalArtifact,
            ArtifactExchangeJson artifactExchangeJson,
            ExportingMetaDTO exportingMetaDTO);

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
            Mono<? extends ExportableArtifact> transactionalArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    Flux<Void> generateArtifactComponentDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends ExportableArtifact> transactionalArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);
}
