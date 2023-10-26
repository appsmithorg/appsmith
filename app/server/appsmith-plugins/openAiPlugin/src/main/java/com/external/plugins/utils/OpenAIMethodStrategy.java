package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.commands.EmbeddingsCommand;
import com.external.plugins.commands.OpenAICommand;
import com.external.plugins.constants.OpenAIConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;

import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.CHAT;
import static com.external.plugins.constants.OpenAIConstants.COMMAND;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS;
import static com.external.plugins.utils.RequestUtils.extractDataFromFormData;

public class OpenAIMethodStrategy {

    public static OpenAICommand selectTriggerMethod(TriggerRequestDTO triggerRequestDTO, ObjectMapper objectMapper) {
        String requestType = triggerRequestDTO.getRequestType();
        return switch (requestType) {
            case OpenAIConstants.CHAT_MODELS -> new ChatCommand(objectMapper);
            case OpenAIConstants.EMBEDDINGS_MODELS -> new EmbeddingsCommand(objectMapper);
            default -> throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR));
        };
    }

    public static OpenAICommand selectExecutionMethod(
            ActionConfiguration actionConfiguration, ObjectMapper objectMapper) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, COMMAND);
        return switch (command) {
            case CHAT -> new ChatCommand(objectMapper);
            case EMBEDDINGS -> new EmbeddingsCommand(objectMapper);
            default -> throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR));
        };
    }
}
