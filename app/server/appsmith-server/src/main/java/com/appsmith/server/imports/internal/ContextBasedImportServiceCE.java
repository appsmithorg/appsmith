package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportableArtifactDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.helpers.ce.ImportArtifactPermissionProvider;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ContextBasedImportServiceCE<
        T extends ImportableArtifact, U extends ImportableArtifactDTO, V extends ArtifactExchangeJson> {

    V extractArtifactExchangeJson(String jsonString);

    ImportArtifactPermissionProvider getImportArtifactPermissionProviderForImportingArtifact(
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

    Mono<U> getImportableArtifactDTO(String workspaceId, String artifactId, ImportableArtifact importableArtifact);

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
            ImportableArtifact importableArtifact,
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
            ImportableArtifact importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO);

    /**
     * Update the artifact after the entities has been created
     * @param importableArtifact : the artifact which has to be updated
     * @return
     */
    Mono<T> updateImportableArtifact(ImportableArtifact importableArtifact);

    Map<String, Object> createImportAnalyticsData(
            ArtifactExchangeJson artifactExchangeJson, ImportableArtifact importableArtifact);

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
            Mono<? extends ImportableArtifact> importableArtifactMono,
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
            Mono<? extends ImportableArtifact> importableArtifactMono,
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
}
