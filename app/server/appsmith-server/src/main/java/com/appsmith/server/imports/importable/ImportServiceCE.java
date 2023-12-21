package com.appsmith.server.imports.importable;

import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ContextImportDTO;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.imports.internal.ContextBasedImportService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface ImportServiceCE {

    ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableContextJson importableContextJson);

    ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableJsonType importableJsonType);

    ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(MediaType contentType);

    Mono<? extends ImportableContextJson> extractImportableContextJson(Part filePart);

    Mono<? extends ContextImportDTO> extractAndSaveContext(String workspaceId, Part filePart, String contextId);

    Mono<? extends ImportableContext> importContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson);

    Mono<? extends ImportableContext> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson);

    Mono<? extends ImportableContext> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName);

    Mono<? extends ContextImportDTO> getContextImportDTO(
            String contextId, String workspaceId, ImportableContext importableContext);
}
