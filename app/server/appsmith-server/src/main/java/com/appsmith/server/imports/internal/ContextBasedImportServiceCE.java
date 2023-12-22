package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import reactor.core.publisher.Mono;

public interface ContextBasedImportServiceCE<
        T extends ImportableContext, U extends ImportableContextDTO, V extends ImportableContextJson> {

    V extractImportableContextJson(String jsonString);

    Mono<T> importContextInWorkspaceFromJson(String workspaceId, ImportableContextJson importableContextJson);

    Mono<T> updateNonGitConnectedContextFromJson(
            String workspaceId, String importableContextId, ImportableContextJson importableContextJson);

    Mono<T> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName);

    Mono<U> getImportableContextDTO(String workspaceId, String contextId, ImportableContext importableContext);
}
