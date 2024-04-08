package com.appsmith.server.imports.importable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ImportableServiceCE<T extends BaseDomain> {

    ArtifactBasedImportableService<T, ?> getArtifactBasedImportableService(ImportingMetaDTO importingMetaDTO);

    Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    default Mono<Void> updateImportedEntities(
            Artifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return null;
    }

    default Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importContextMono,
            ArtifactExchangeJson artifactExchangeJson,
            boolean isContextAgnostic) {
        return null;
    }

    default Flux<T> getEntitiesPresentInWorkspace(String workspaceId) {
        return null;
    }
}
