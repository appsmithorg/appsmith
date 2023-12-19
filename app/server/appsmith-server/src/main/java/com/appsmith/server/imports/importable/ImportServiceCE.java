package com.appsmith.server.imports.importable;

import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ContextImportDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.imports.internal.ContextBasedImportService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface ImportServiceCE {

    ContextBasedImportService<?> getContextBasedImportService(ImportableContextJson importableContextJson);

    ContextBasedImportService<?> getContextBasedImportService(ImportableJsonType importableJsonType);

    ContextBasedImportService<?> getContextBasedImportService(MediaType contentType);

    Mono<ImportableContextJson> extractImportableContextJson(Part filePart);

    Mono<ContextImportDTO> extractAndSaveContext(String workspaceId, Part filePart, String contextId);

    Mono<ImportableContext> importContextInWorkspaceFromJson(String workspaceId, ImportableContextJson contextJson);

    Mono<ImportableContext> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson);

    Mono<ContextImportDTO> getContextImportDTO(
            String contextId, String workspaceId, ImportableContext importableContext);
}
