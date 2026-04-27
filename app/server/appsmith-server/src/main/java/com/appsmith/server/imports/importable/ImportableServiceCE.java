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

    /**
     * Strips identity fields (primary key {@code id}, {@code baseId}, foreign-key pointers, git metadata,
     * audit fields, policies) from the slice of the {@link ArtifactExchangeJson} that this service owns,
     * so that a crafted or otherwise polluted payload cannot overwrite existing DB documents via
     * attacker-controlled ids.
     *
     * <p>Invoked once at the top of the import pipeline, before validation and before any importable
     * service consumes the JSON. Retains {@code gitSyncId} and name-based cross-references which are the
     * legitimate glue the importer rewires via name-maps.
     *
     * <p>Implementations should delegate to the canonical {@code sanitiseToExportDBObject()} and
     * {@code makePristine()} on each entity they own. Services whose entities expose a composite id that
     * the importer consumes as a wiring key (e.g. {@code NewAction} / {@code ActionCollection} using
     * {@code pageName_actionName}) may skip {@code makePristine()} here and rely on the existing
     * save-time {@code makePristine()} in their own {@code importEntities} pipeline.
     *
     * <p>Default is a no-op so services that don't own any JSON-level list (e.g. context-agnostic helpers)
     * don't need to override.
     *
     * @param artifactExchangeJson the incoming JSON payload; mutated in place
     */
    default void sanitizeEntitiesInJsonForImport(ArtifactExchangeJson artifactExchangeJson) {}
}
