package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.helpers.ce.ImportContextPermissionProvider;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ContextBasedImportServiceCE<
        T extends ImportableContext, U extends ImportableContextDTO, V extends ImportableContextJson> {

    V extractImportableContextJson(String jsonString);

    ImportContextPermissionProvider getImportContextPermissionProviderForImportingContext(Set<String> userPermissions);

    ImportContextPermissionProvider getImportContextPermissionProviderForUpdatingContext(Set<String> userPermissions);

    ImportContextPermissionProvider getImportContextPermissionProviderForConnectingToGit(Set<String> userPermissions);

    ImportContextPermissionProvider getImportContextPermissionProviderForRestoringSnapshot(Set<String> userPermissions);

    ImportContextPermissionProvider getImportContextPermissionProviderForMergingImportableContextWithJson(
            Set<String> userPermissions);

    default void updateContextJsonWithRequiredPagesToImport(
            ImportableContextJson importableContextJson, List<String> pagesToImport) {}

    void dehydrateNameForContextUpdate(String contextId, ImportableContextJson importableContextJson);

    Mono<U> getImportableContextDTO(String workspaceId, String contextId, ImportableContext importableContext);

    Mono<Void> contextSpecificImportedEntities(
            ImportableContextJson importableContextJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO);

    void performAuxiliaryImportTasks(ImportableContextJson importableContextJson);

    Mono<T> updateAndSaveContextInFocus(
            ImportableContext importableContext,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<User> currentUserMono);

    Mono<T> updateImportableEntities(
            ImportableContext importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO);

    Mono<T> updateImportableContext(ImportableContext importableContext);

    Map<String, Object> createImportAnalyticsData(
            ImportableContextJson importableContextJson, ImportableContext importableContext);

    Flux<Void> obtainContextSpecificImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableContext> importedContextMono,
            ImportableContextJson importableContextJson);

    Flux<Void> obtainContextComponentDependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableContext> importedContextMono,
            ImportableContextJson importableContextJson);

    String validateContextSpecificFields(ImportableContextJson importableContextJson);

    Map<String, String> getConstantsMap();
}
