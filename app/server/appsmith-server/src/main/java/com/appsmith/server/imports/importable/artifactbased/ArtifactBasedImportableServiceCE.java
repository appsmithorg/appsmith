package com.appsmith.server.imports.importable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

public interface ArtifactBasedImportableServiceCE<T extends BaseDomain, U extends ImportableArtifact> {
    List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO);

    void renameContextInImportableResources(List<T> resourceList, String oldContextName, String newContextName);

    Flux<T> getExistingResourcesInCurrentArtifactFlux(ImportableArtifact artifact);

    Flux<T> getExistingResourcesInOtherBranchesFlux(String artifactId);

    Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackDefaultContextId);

    void populateDefaultResources(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportableArtifact artifact,
            T branchedResource,
            T resource);

    void createNewResource(ImportingMetaDTO importingMetaDTO, T actionCollection, Context defaultContext);
}
