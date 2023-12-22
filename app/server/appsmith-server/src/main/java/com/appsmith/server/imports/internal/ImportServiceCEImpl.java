package com.appsmith.server.imports.internal;

import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.imports.importable.ImportServiceCE;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ImportableJsonType.APPLICATION;

@Slf4j
public class ImportServiceCEImpl implements ImportServiceCE {

    public static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";
    private final ApplicationImportService applicationImportService;
    private final Map<ImportableJsonType, ContextBasedImportService<?, ?, ?>> serviceFactory = new HashMap<>();

    public ImportServiceCEImpl(ApplicationImportService applicationImportService) {
        this.applicationImportService = applicationImportService;
        serviceFactory.put(APPLICATION, applicationImportService);
    }

    @Override
    public ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableContextJson importableContextJson) {
        return getContextBasedImportService(importableContextJson.getImportableJsonType());
    }

    @Override
    public ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableJsonType importableJsonType) {
        return serviceFactory.getOrDefault(importableJsonType, applicationImportService);
    }

    @Override
    public ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(MediaType contentType) {
        if (MediaType.APPLICATION_JSON.equals(contentType)) {
            return applicationImportService;
        }

        return applicationImportService;
    }

    public Mono<? extends ImportableContextJson> extractImportableContextJson(Part filePart) {

        final MediaType contentType = filePart.headers().getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            log.error("Invalid content type, {}", contentType);
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, INVALID_JSON_FILE));
        }

        return DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                })
                .map(jsonString -> getContextBasedImportService(contentType).extractImportableContextJson(jsonString));
    }

    @Override
    public Mono<? extends ImportableContextDTO> extractAndSaveContext(
            String workspaceId, Part filePart, String contextId) {
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<ImportableContextDTO> importedContextMono = extractImportableContextJson(filePart)
                .flatMap(contextJson -> {
                    if (StringUtils.isEmpty(contextId)) {
                        return importContextInWorkspaceFromJson(workspaceId, contextJson);
                    } else {
                        return updateNonGitConnectedContextFromJson(workspaceId, contextId, contextJson);
                    }
                })
                .flatMap(context -> getContextImportDTO(context.getWorkspaceId(), context.getId(), context));

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends ImportableContext> importContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson) {

        // workspace id must be present and valid
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        return getContextBasedImportService(contextJson).importContextInWorkspaceFromJson(workspaceId, contextJson);
    }

    @Override
    public Mono<? extends ImportableContext> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson) {

        if (!StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (StringUtils.isEmpty(contextId)) {
            // error message according to the context
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<Boolean> isContextConnectedToGitMono = Mono.just(Boolean.FALSE);

        Mono<ImportableContext> importedContextMono = isContextConnectedToGitMono.flatMap(isConnectedToGit -> {
            if (isConnectedToGit) {
                return Mono.error(new AppsmithException(
                        AppsmithError.UNSUPPORTED_IMPORT_OPERATION_FOR_GIT_CONNECTED_APPLICATION));
            } else {
                return getContextBasedImportService(importableContextJson)
                        .updateNonGitConnectedContextFromJson(workspaceId, contextId, importableContextJson)
                        .onErrorResume(error -> {
                            if (error instanceof AppsmithException) {
                                return Mono.error(error);
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, error.getMessage()));
                        });
            }
        });

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends ImportableContext> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName) {

        return getContextBasedImportService(importableContextJson)
                .importContextInWorkspaceFromGit(workspaceId, contextId, importableContextJson, branchName);
    }

    @Override
    public Mono<? extends ImportableContextDTO> getContextImportDTO(
            String workspaceId, String contextId, ImportableContext importableContext) {
        return applicationImportService.getImportableContextDTO(workspaceId, contextId, importableContext);
    }
}
