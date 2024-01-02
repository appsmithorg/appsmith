package com.appsmith.server.imports.internal;

import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ContextBasedImportServiceCE<
        T extends ImportableContext, U extends ImportableContextDTO, V extends ImportableContextJson> {

    V extractImportableContextJson(String jsonString);

    Mono<T> importContextInWorkspaceFromJson(String workspaceId, ImportableContextJson importableContextJson);

    Mono<T> updateNonGitConnectedContextFromJson(
            String workspaceId, String importableContextId, ImportableContextJson importableContextJson);

    Mono<T> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName);

    Mono<U> getImportableContextDTO(String workspaceId, String contextId, ImportableContext importableContext);

    Mono<Void> contextSpecificImportedEntities(
            ImportableContextJson importableContextJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO);

    void performAuxiliaryImportTasks(ImportableContextJson importableContextJson);

    Mono<T> getImportContextMono(
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
            ImportableContextJson importableContextJson, ImportableContext importableContext, Stopwatch stopwatch);
}
