package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.commands.EmbeddingsCommand;
import com.external.plugins.commands.OpenAICommand;
import com.external.plugins.commands.VisionCommand;
import com.external.plugins.constants.OpenAIConstants;
import com.google.gson.Gson;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;

import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.CHAT;
import static com.external.plugins.constants.OpenAIConstants.COMMAND;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS;
import static com.external.plugins.constants.OpenAIConstants.VISION;
import static com.external.plugins.utils.RequestUtils.extractDataFromFormData;

public class OpenAIMethodStrategy {

    public static OpenAICommand selectTriggerMethod(TriggerRequestDTO triggerRequestDTO, Gson gson) {
        String requestType = triggerRequestDTO.getRequestType();
        return switch (requestType) {
            case OpenAIConstants.CHAT_MODELS -> new ChatCommand(gson);
            case OpenAIConstants.EMBEDDINGS_MODELS -> new EmbeddingsCommand(gson);
            case OpenAIConstants.VISION_MODELS -> new VisionCommand(gson);
            default -> throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR));
        };
    }

    public static OpenAICommand selectExecutionMethod(ActionConfiguration actionConfiguration, Gson gson) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, COMMAND);
        return switch (command) {
            case CHAT -> new ChatCommand(gson);
            case EMBEDDINGS -> new EmbeddingsCommand(gson);
            case VISION -> new VisionCommand(gson);
            default -> throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR));
        };
    }
}
