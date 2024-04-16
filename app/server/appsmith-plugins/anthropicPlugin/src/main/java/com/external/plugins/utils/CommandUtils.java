package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.util.StringUtils;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AnthropicConstants.DATA;
import static com.external.plugins.constants.AnthropicConstants.DEFAULT_MAX_TOKEN;
import static com.external.plugins.constants.AnthropicConstants.DEFAULT_TEMPERATURE;
import static com.external.plugins.constants.AnthropicConstants.JSON;
import static com.external.plugins.constants.AnthropicConstants.MAX_TOKENS;
import static com.external.plugins.constants.AnthropicConstants.TEMPERATURE;
import static com.external.plugins.constants.AnthropicConstants.VIEW_TYPE;
import static com.external.plugins.constants.AnthropicErrorMessages.BAD_MAX_TOKEN_CONFIGURATION;
import static com.external.plugins.constants.AnthropicErrorMessages.BAD_TEMPERATURE_CONFIGURATION;
import static com.external.plugins.constants.AnthropicErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.AnthropicErrorMessages.STRING_APPENDER;

public class CommandUtils {
    private static final Gson gson = new Gson();
    /**
     * When JS is enabled in form component, value is stored in data key only. Difference is if viewType is json,
     * it's stored as JSON string otherwise it's Java serialized object
     */
    public static List<Map<String, String>> getMessages(Map<String, Object> messages) {
        Type listType = new TypeToken<List<Map<String, String>>>() {}.getType();
        if (messages.containsKey(VIEW_TYPE) && JSON.equals(messages.get(VIEW_TYPE))) {
            // data is present in data key as String
            return gson.fromJson((String) messages.get(DATA), listType);
        }
        // return object stored in data key
        return (List<Map<String, String>>) messages.get(DATA);
    }

    public static int getMaxTokenFromFormData(Map<String, Object> formData) {
        String maxTokenAsString = RequestUtils.extractValueFromFormData(formData, MAX_TOKENS);

        if (!StringUtils.hasText(maxTokenAsString)) {
            return DEFAULT_MAX_TOKEN;
        }

        try {
            return Integer.parseInt(maxTokenAsString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return DEFAULT_MAX_TOKEN;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_MAX_TOKEN_CONFIGURATION));
        }
    }

    public static Float getTemperatureFromFormData(Map<String, Object> formData) {
        String temperatureString = RequestUtils.extractValueFromFormData(formData, TEMPERATURE);

        if (!StringUtils.hasText(temperatureString)) {
            return DEFAULT_TEMPERATURE;
        }

        try {
            return Float.parseFloat(temperatureString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return DEFAULT_TEMPERATURE;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_TEMPERATURE_CONFIGURATION));
        }
    }

    /**
     * Anthropic message API expect role to be one of user or assistant. This method converts Human to user and Assistant to assistant
     * @param role - Appsmith understood role
     * @return - Actual role value expected by Anthropic message API
     */
    public static String getActualRoleValue(String role) {
        if (role == null) {
            return null;
        }
        return switch (role) {
            case "Human" -> "user";
            case "Assistant" -> "assistant";
            default -> role;
        };
    }
}
