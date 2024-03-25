package com.appsmith.server.imports.importable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

public interface ArtifactBasedImportableServiceCE<T extends BaseDomain, U extends Artifact> {
    List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO);

    void renameContextInImportableResources(List<T> resourceList, String oldContextName, String newContextName);

    Flux<T> getExistingResourcesInCurrentArtifactFlux(Artifact artifact);

    Flux<T> getExistingResourcesInOtherBranchesFlux(String defaultArtifactId, String currentArtifactId);

    Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackDefaultContextId);

    void populateDefaultResources(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Artifact artifact,
            T branchedResource,
            T resource);

    void createNewResource(ImportingMetaDTO importingMetaDTO, T actionCollection, Context defaultContext);

    default T getExistingEntityInCurrentBranchForImportedEntity(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, T> entityInCurrentArtifact,
            T entity) {
        return entityInCurrentArtifact.get(entity.getGitSyncId());
    }

    default T getExistingEntityInOtherBranchForImportedEntity(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, Map<String, T> entityInOtherArtifact, T entity) {
        return entityInOtherArtifact.get(entity.getGitSyncId());
    }
}
