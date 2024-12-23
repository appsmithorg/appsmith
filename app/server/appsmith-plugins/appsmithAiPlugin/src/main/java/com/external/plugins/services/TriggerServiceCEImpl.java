package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.external.plugins.dtos.SourceDetails;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.CommonFieldName.VALUE;
import static com.external.plugins.constants.AppsmithAiConstants.DISABLED;
import static com.external.plugins.constants.AppsmithAiConstants.LABEL;
import static com.external.plugins.constants.AppsmithAiConstants.LIST_FILES;
import static com.external.plugins.constants.AppsmithAiConstants.UPLOAD_FILES;
import static com.external.plugins.utils.FileUtils.getFileIds;

@Slf4j
public class TriggerServiceCEImpl implements TriggerService {

    protected static final AiServerService aiServerService = new AiServerServiceImpl();

    @Override
    public Mono<TriggerResultDTO> executeTrigger(
            APIConnection connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
        String requestType = request.getRequestType();
        return switch (requestType) {
            case UPLOAD_FILES -> this.uploadFiles(request);
            case LIST_FILES -> this.listFiles(datasourceConfiguration, request);
            default -> Mono.empty();
        };
    }

    private Mono<TriggerResultDTO> uploadFiles(TriggerRequestDTO request) {
        SourceDetails sourceDetails = SourceDetails.createSourceDetails(request);
        return aiServerService
                .uploadFiles(request.getFiles(), sourceDetails)
                .flatMap(response -> {
                    TriggerResultDTO triggerResultDTO = new TriggerResultDTO();
                    triggerResultDTO.setTrigger(response);
                    return Mono.just(triggerResultDTO);
                })
                .onErrorResume(error -> handleError("An error has occurred while trying to upload files", error));
    }

    private Mono<TriggerResultDTO> listFiles(
            DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
        SourceDetails sourceDetails = SourceDetails.createSourceDetails(request);
        List<String> fileIds = getFileIds(datasourceConfiguration);
        if (fileIds.isEmpty()) {
            TriggerResultDTO triggerResultDTO = new TriggerResultDTO();
            triggerResultDTO.setTrigger(List.of(Map.of(
                    DISABLED, true, LABEL, "No files available in the datasource", VALUE, "NO_FILES_AVAILABLE")));
            return Mono.just(triggerResultDTO);
        }
        return aiServerService
                .getFilesStatus(fileIds, sourceDetails)
                .flatMap(fileStatusDTO -> {
                    List<Map<String, Object>> response = new ArrayList<>();
                    fileStatusDTO.getFiles().forEach(file -> {
                        Map<String, Object> dropdownOption = new HashMap<>();
                        if (!file.isProcessed()) {
                            dropdownOption.put(LABEL, "(Processing...) " + file.getName());
                        } else {
                            dropdownOption.put(LABEL, file.getName());
                        }
                        dropdownOption.put(VALUE, file.getId());
                        dropdownOption.put(DISABLED, !file.isProcessed());
                        response.add(dropdownOption);
                    });
                    TriggerResultDTO triggerResultDTO = new TriggerResultDTO();
                    triggerResultDTO.setTrigger(response);
                    return Mono.just(triggerResultDTO);
                })
                .onErrorResume(
                        error -> handleError("An error has occurred while trying to list uploaded files", error));
    }

    protected Mono<TriggerResultDTO> handleError(String message, Throwable error) {
        log.error("{}. Error: {}", message, error.getMessage());
        if (!(error instanceof AppsmithPluginException)) {
            error = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, error.getMessage(), error);
        }
        return Mono.error(error);
    }
}
