package com.appsmith.server.imports.internal.artifactbased;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ArtifactBasedImportServiceCE<
        T extends Artifact, U extends ArtifactImportDTO, V extends ArtifactExchangeJson> {

    Mono<ImportArtifactPermissionProvider> getImportArtifactPermissionProviderForImportingArtifact(
            Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportArtifactPermissionProviderForUpdatingArtifact(
            Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportArtifactPermissionProviderForConnectingToGit(Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportArtifactPermissionProviderForRestoringSnapshot(
            Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportArtifactPermissionProviderForMergingJsonWithArtifact(
            Set<String> userPermissions);

    /**
     * this method creates updates the entities which is to be imported in context to the artifact
     *
     * @param artifactExchangeJson : json for the artifact which is going to be imported
     * @param entitiesToImport : list of names of entities which is going to be imported
     */
    default void updateArtifactExchangeJsonWithEntitiesToBeConsumed(
            ArtifactExchangeJson artifactExchangeJson, List<String> entitiesToImport) {}

    /**
     * this method sets the names to null before the update to avoid conflict
     *
     * @param artifactId
     * @param artifactExchangeJson
     */
    void setJsonArtifactNameToNullBeforeUpdate(String artifactId, ArtifactExchangeJson artifactExchangeJson);

    /**
     * Strips identity fields (e.g. primary key {@code id}, {@code baseId}, foreign-key pointers like
     * {@code gitApplicationMetadata} or {@code datasourceId}, plus audit fields like {@code createdAt},
     * {@code updatedAt}, {@code policies}) from every domain object reachable through the
     * {@link ArtifactExchangeJson}. Retains the legitimate correlation key {@code gitSyncId} and any
     * name-based cross-references the importer rewires via name-maps.
     *
     * <p>This is a defensive step invoked once at the top of the import pipeline, before validation and
     * before any importable service consumes the JSON. It ensures that a crafted or otherwise polluted
     * JSON cannot overwrite existing database documents by carrying attacker-controlled ids.
     *
     * <p>Implementations should delegate to the canonical {@code sanitiseToExportDBObject()} and
     * {@code makePristine()} on each entity, mirroring what a freshly-exported JSON looks like, with a
     * narrow carve-out for entities whose composite {@code id} is consumed by the importer as a wiring
     * key (e.g. {@code NewAction}/{@code ActionCollection}); those entities rely on the existing
     * save-time {@code makePristine()} in their per-service importers.
     *
     * @param artifactExchangeJson the incoming JSON payload; mutated in place
     */
    default void sanitizeJsonForImport(ArtifactExchangeJson artifactExchangeJson) {}

    U getImportableArtifactDTO(Artifact importableArtifact, List<Datasource> datasourceList, String environmentId);

    /**
     * This method sets the client & server schema version to artifacts which is inside JSON from the clientSchemaVersion
     * & serverSchemaVersion attribute from ArtifactExchangeJson
     * @param artifactExchangeJson : ArtifactExchangeJson created from file part while import flow
     */
    void syncClientAndSchemaVersion(ArtifactExchangeJson artifactExchangeJson);

    /**
     * This method saves the context from the import json for the first time after dehydrating all the details which can cause conflicts
     *
     * @param importableArtifact
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param currentUserMono
     * @return
     */
    Mono<T> updateAndSaveArtifactInContext(
            Artifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<User> currentUserMono);

    /**
     * update importable entities with the context references post creation of context in db
     * @param importableContext
     * @param mappedImportableResourcesDTO
     * @param importingMetaDTO
     * @return
     */
    Mono<T> updateImportableEntities(
            Artifact importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO);

    /**
     * Update the artifact after the entities has been created
     * @param importableArtifact : the artifact which has to be updated
     * @return
     */
    Mono<T> updateImportableArtifact(Artifact importableArtifact);

    Map<String, Object> createImportAnalyticsData(
            ArtifactExchangeJson artifactExchangeJson, Artifact importableArtifact);

    /**
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param workspaceMono
     * @param importableArtifactMono
     * @param artifactExchangeJson
     * @return
     */
    Flux<Void> generateArtifactContextIndependentImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    /**
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param workspaceMono
     * @param importableArtifactMono
     * @param artifactExchangeJson
     * @return
     */
    Flux<Void> generateArtifactContextDependentImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson);

    /**
     * Add entities which are specific to the artifact. i.e. customJsLib
     * @param artifactExchangeJson
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @return
     */
    Mono<Void> generateArtifactSpecificImportableEntities(
            ArtifactExchangeJson artifactExchangeJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO);

    Mono<Boolean> isArtifactConnectedToGit(String artifactId);

    String validateArtifactSpecificFields(ArtifactExchangeJson artifactExchangeJson);

    /**
     *  This map keeps constants which are specific to the contexts i.e. Application, packages.
     *  which is parallel to other Artifacts.
     *  i.e. Artifact --> Application, Packages
     *  i.e. ID --> applicationId, packageId
     */
    Map<String, String> getArtifactSpecificConstantsMap();

    Mono<Set<String>> getDatasourceIdSetConsumedInArtifact(String baseArtifactId);

    Flux<String> getBranchedArtifactIdsByBranchedArtifactId(String branchedArtifactId);

    Mono<V> migrateArtifactExchangeJson(String branchedArtifactId, ArtifactExchangeJson artifactExchangeJson);

    Mono<T> getImportedArtifactFromDatabase(String artifactId);

    /**
     * Performs post-import processing for an artifact after it has been successfully imported
     * and the database transaction has been committed.
     *
     * <p>This hook is called outside the main import transaction, allowing for operations that:
     * <ul>
     *   <li>May require the imported entities to be fully persisted in the database</li>
     *   <li>Can safely fail without rolling back the import transaction</li>
     *   <li>Need to trigger additional workflows based on the imported artifact</li>
     * </ul>
     *
     * <p><b>CE Implementation (Applications):</b> Updates all page layouts to ensure DSL
     * bindings are correctly resolved with the newly imported actions and widgets.</p>
     *
     * <p><b>EE Implementation (Applications):</b> Additionally performs a Just-In-Time (JIT)
     * package pull before updating layouts, ensuring module instances from connected packages
     * are available when computing layouts.</p>
     *
     * @param artifact The imported artifact that requires post-processing.
     * @return A {@link Mono} that completes when the post-import processing is finished.
     *         Errors are logged but do not fail the overall import operation.
     */
    Mono<Void> postImportHook(Artifact artifact);
}
