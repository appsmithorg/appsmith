package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.COMPONENT;
import static com.external.plugins.constants.OpenAIConstants.COMPONENT_DATA;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static com.external.plugins.constants.OpenAIConstants.JSON;
import static com.external.plugins.constants.OpenAIConstants.VIEW_TYPE;
import static com.external.plugins.constants.OpenAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_MESSAGE_FORMAT;
import static com.external.plugins.constants.OpenAIErrorMessages.STRING_APPENDER;

public class MessageUtils {
    private static final Gson gson = new Gson();

    public static Object extractMessages(Map<String, Object> messages) {
        if (messages == null || !messages.containsKey(DATA)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }
        Type listType = new TypeToken<List<Map<String, String>>>() {}.getType();
        if (messages.containsKey(VIEW_TYPE)) {
            if (JSON.equals(messages.get(VIEW_TYPE))) {
                // data is present in data key as String
                return gson.fromJson((String) messages.get(DATA), listType);
            } else if (COMPONENT.equals(messages.get(VIEW_TYPE))) {
                return messages.get(COMPONENT_DATA);
            }
        }
        return messages.get(DATA);
    }
}
