package com.appsmith.server.imports.importable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.GitSyncedDomain;
import com.appsmith.external.models.RefAwareDomain;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface ArtifactBasedImportableServiceCE<T extends BaseDomain, U extends Artifact> {
    List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO);

    void renameContextInImportableResources(List<T> resourceList, String oldContextName, String newContextName);

    Flux<T> getExistingResourcesInCurrentArtifactFlux(Artifact artifact);

    Flux<T> getExistingResourcesInOtherBranchesFlux(List<String> branchedArtifactIds, String currentArtifactId);

    void updateArtifactId(T resource, Artifact artifact);

    Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackBaseContextId);

    default void populateBaseId(ImportingMetaDTO importingMetaDTO, Artifact artifact, T branchedResource, T resource) {
        RefAwareDomain refAwareResource = (RefAwareDomain) resource;
        RefAwareDomain refAwareRefResource = (RefAwareDomain) branchedResource;

        refAwareResource.setRefType(importingMetaDTO.getRefType());
        refAwareResource.setRefName(importingMetaDTO.getRefName());
        if (artifact.getGitArtifactMetadata() != null && branchedResource != null) {
            refAwareResource.setBaseId(refAwareRefResource.getBaseId());

        } else {
            refAwareResource.setBaseId(refAwareResource.getBaseIdOrFallback());
        }
    }

    Mono<T> createNewResource(ImportingMetaDTO importingMetaDTO, T entity, Context baseContext);

    default T getExistingEntityInCurrentBranchForImportedEntity(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, T> entityInCurrentArtifact,
            T entity) {
        if (entity instanceof GitSyncedDomain gitSyncedEntity) {
            return entityInCurrentArtifact.get(gitSyncedEntity.getGitSyncId());
        } else {
            return entity;
        }
    }

    default T getExistingEntityInOtherBranchForImportedEntity(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, Map<String, T> entityInOtherArtifact, T entity) {
        if (entity instanceof GitSyncedDomain gitSyncedEntity) {
            return entityInOtherArtifact.get(gitSyncedEntity.getGitSyncId());
        } else {
            return entity;
        }
    }
}
