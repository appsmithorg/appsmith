package com.appsmith.server.imports.importable;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ContextImportDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface ImportServiceCE {

    Mono<ContextImportDTO> extractAndSaveContext(String workspaceId, Part filePart, String contextId);

    Mono<ImportableContext> importContextApplicationInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson);

    Mono<ImportableContext> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson);

    Mono<ContextImportDTO> getContextImportDTO(
            String contextId, String workspaceId, ImportableContext importableContext);
}
