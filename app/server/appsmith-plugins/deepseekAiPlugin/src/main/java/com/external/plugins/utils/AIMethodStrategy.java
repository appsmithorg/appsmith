package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.commands.AICommand;
import com.external.plugins.constants.DeepseekAIConstants;
import com.google.gson.Gson;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;

import java.util.Map;

import static com.external.plugins.constants.DeepseekAIConstants.CHAT;
import static com.external.plugins.constants.DeepseekAIConstants.COMMAND;

import static com.external.plugins.utils.RequestUtils.extractDataFromFormData;

public class AIMethodStrategy {

    public static AICommand selectTriggerMethod(TriggerRequestDTO triggerRequestDTO, Gson gson) {
        //Maintain a structure similar to OpenAI's, preserving extensibility for future capabilities.
        return new ChatCommand(gson);
    }

    public static AICommand selectExecutionMethod(ActionConfiguration actionConfiguration, Gson gson) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }
        //Maintain a structure similar to OpenAI's, preserving extensibility for future capabilities.
        return new ChatCommand(gson);
    }
}
