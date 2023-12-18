package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.commands.GenerateContentCommand;
import com.external.plugins.commands.GoogleAICommand;
import com.external.plugins.constants.GoogleAIConstants;
import com.google.gson.Gson;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;

import java.util.Map;

import static com.external.plugins.utils.RequestUtils.extractDataFromFormData;

public class GoogleAIMethodStrategy {
    public static GoogleAICommand selectTriggerMethod(TriggerRequestDTO triggerRequestDTO, Gson gson) {
        String requestType = triggerRequestDTO.getRequestType();

        return switch (requestType) {
            case GoogleAIConstants.GENERATE_CONTENT_MODELS -> new GenerateContentCommand();
            default -> throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR));
        };
    }

    public static GoogleAICommand selectExecutionMethod(ActionConfiguration actionConfiguration, Gson gson) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, GoogleAIConstants.COMMAND);

        return selectExecutionMethod(command);
    }

    public static GoogleAICommand selectExecutionMethod(String command) {
        return switch (command) {
            case GoogleAIConstants.GENERATE_CONTENT -> new GenerateContentCommand();
            default -> throw Exceptions.propagate(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unsupported command: " + command));
        };
    }
}
