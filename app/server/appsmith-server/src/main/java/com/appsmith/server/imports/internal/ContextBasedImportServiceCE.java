package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.helpers.ce.ImportArtifactPermissionProvider;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ContextBasedImportServiceCE<
        T extends ImportableArtifact, U extends ImportableContextDTO, V extends ImportableContextJson> {

    V extractImportableContextJson(String jsonString);

    ImportArtifactPermissionProvider getImportContextPermissionProviderForImportingContext(Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportContextPermissionProviderForUpdatingContext(Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportContextPermissionProviderForConnectingToGit(Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportContextPermissionProviderForRestoringSnapshot(
            Set<String> userPermissions);

    ImportArtifactPermissionProvider getImportContextPermissionProviderForMergingImportableContextWithJson(
            Set<String> userPermissions);

    /**
     * this method creates updates the entities which is to be imported in the given context
     * @param importableContextJson
     * @param pagesToImport
     */
    default void updateContextJsonWithRequiredPagesToImport(
            ImportableContextJson importableContextJson, List<String> pagesToImport) {}

    /**
     * this method sets the names to null before the update to avoid conflict
     * @param contextId
     * @param importableContextJson
     */
    void setJsonContextNameToNullBeforeUpdate(String contextId, ImportableContextJson importableContextJson);

    Mono<U> getImportableContextDTO(String workspaceId, String contextId, ImportableArtifact importableContext);

    /**
     * Add entities which are specific to the context. i.e. customJsLib
     * @param importableContextJson
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @return
     */
    Mono<Void> contextSpecificImportedEntities(
            ImportableContextJson importableContextJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO);

    void performAuxiliaryImportTasks(ImportableContextJson importableContextJson);

    /**
     * This method saves the context from the import json for the first time after dehydrating all the details which can cause conflicts
     * @param importableContext
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param currentUserMono
     * @return
     */
    Mono<T> updateAndSaveContextInFocus(
            ImportableArtifact importableContext,
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
     * Update the context after the entities has been created
     * @param importableContext
     * @return
     */
    Mono<T> updateImportableContext(ImportableArtifact importableContext);

    Map<String, Object> createImportAnalyticsData(
            ImportableContextJson importableContextJson, ImportableArtifact importableContext);

    Flux<Void> obtainContextSpecificImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importedContextMono,
            ImportableContextJson importableContextJson);

    Flux<Void> obtainContextComponentDependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importedContextMono,
            ImportableContextJson importableContextJson);

    String validateContextSpecificFields(ImportableContextJson importableContextJson);

    Map<String, String> getConstantsMap();
}
