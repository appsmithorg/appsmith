package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.commands.AnthropicCommand;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.commands.VisionCommand;
import com.external.plugins.constants.AnthropicConstants;
import com.google.gson.Gson;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;

import java.util.Map;

import static com.external.plugins.utils.RequestUtils.extractDataFromFormData;

public class AnthropicMethodStrategy {
    public static AnthropicCommand selectTriggerMethod(TriggerRequestDTO triggerRequestDTO, Gson gson) {
        String requestType = triggerRequestDTO.getRequestType();

        return switch (requestType) {
            case AnthropicConstants.CHAT_MODELS -> new ChatCommand();
            case AnthropicConstants.VISION_MODELS -> new VisionCommand();
            default -> throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR));
        };
    }

    public static AnthropicCommand selectExecutionMethod(ActionConfiguration actionConfiguration, Gson gson) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, AnthropicConstants.COMMAND);

        return selectExecutionMethod(command);
    }

    public static AnthropicCommand selectExecutionMethod(String command) {
        return switch (command) {
            case AnthropicConstants.CHAT -> new ChatCommand();
            case AnthropicConstants.VISION -> new VisionCommand();
            default -> throw Exceptions.propagate(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unsupported command: " + command));
        };
    }
}
