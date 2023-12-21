package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface ContextBasedImportServiceCE<T extends ImportableContext, U extends ImportableContextDTO> {

    ImportableContextJson extractImportableContextJson(String jsonString);

    Mono<T> importContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson importableContextJson, Set<String> currentUserPermissionGroup);

    Mono<T> updateNonGitConnectedContextFromJson(
            String workspaceId, String importableContextId, ImportableContextJson importableContextJson);
}
