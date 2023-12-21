package com.appsmith.server.imports.internal;

import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ContextImportDTO;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.imports.importable.ImportServiceCE;
import com.appsmith.server.repositories.PermissionGroupRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

import java.util.Set;

import static com.appsmith.server.constants.ImportableJsonType.APPLICATION;

@Slf4j
public class ImportServiceCEImpl implements ImportServiceCE {

    public static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";
    private final ApplicationImportService applicationImportService;
    private final PermissionGroupRepository permissionGroupRepository;

    public ImportServiceCEImpl(
            ApplicationImportService applicationImportService, PermissionGroupRepository permissionGroupRepository) {
        this.applicationImportService = applicationImportService;
        this.permissionGroupRepository = permissionGroupRepository;
    }

    @Override
    public ContextBasedImportService<? extends ImportableContext, ? extends ImportableContextDTO>
            getContextBasedImportService(ImportableContextJson importableContextJson) {
        return getContextBasedImportService(importableContextJson.getImportableJsonType());
    }

    @Override
    public ContextBasedImportService<? extends ImportableContext, ? extends ImportableContextDTO>
            getContextBasedImportService(ImportableJsonType importableJsonType) {
        if (APPLICATION.equals(importableJsonType)) {
            return applicationImportService;
        }

        // rest of the services would be taken from here
        return applicationImportService;
    }

    @Override
    public ContextBasedImportService<? extends ImportableContext, ? extends ImportableContextDTO>
            getContextBasedImportService(MediaType contentType) {
        if (MediaType.APPLICATION_JSON.equals(contentType)) {
            return applicationImportService;
        }

        return applicationImportService;
    }

    public Mono<ImportableContextJson> extractImportableContextJson(Part filePart) {

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
    public Mono<ContextImportDTO> extractAndSaveContext(String workspaceId, Part filePart, String contextId) {
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<ContextImportDTO> importedContextMono = extractImportableContextJson(filePart)
                .flatMap(contextJson -> {
                    if (StringUtils.isEmpty(contextId)) {
                        return importContextInWorkspaceFromJson(workspaceId, contextJson);
                    } else {
                        return updateNonGitConnectedContextFromJson(workspaceId, contextId, contextJson);
                    }
                })
                .flatMap(context -> getContextImportDTO(context.getId(), context.getWorkspaceId(), context));

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<ImportableContext> importContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson) {

        // workspace id must be present and valid
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .flatMap(userPermissionGroups -> getContextBasedImportService(contextJson)
                        .importContextInWorkspaceFromJson(workspaceId, contextJson, userPermissionGroups));
    }

    @Override
    public Mono<ImportableContext> updateNonGitConnectedContextFromJson(
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
                        .updateNonGitConnectedContextFromJson(
                                workspaceId, contextId, (ApplicationJson) importableContextJson)
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
    public Mono<ContextImportDTO> getContextImportDTO(
            String contextId, String workspaceId, ImportableContext importableContext) {
        return null;
    }

    private ApplicationJson getTypecastedContextJsons(ImportableContextJson importableContextJson) {
        if (APPLICATION.equals(importableContextJson.getImportableJsonType())) {
            return (ApplicationJson) importableContextJson;
        }

        return (ApplicationJson) importableContextJson;
    }
}
