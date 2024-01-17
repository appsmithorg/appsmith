package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.INPUT;

public class FieldValidationHelper {
    public static void validateTextInput(Map<String, Object> formData, String key) {
        if (!formData.containsKey(key) || !(formData.get(key) instanceof Map)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "input is not provided");
        }

        Map<String, Object> inputMap = (Map<String, Object>) formData.get(key);

        if (!inputMap.containsKey(INPUT)
                || !StringUtils.hasLength(RequestUtils.extractDataFromFormData(inputMap, INPUT))) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "input is not provided");
        }
    }

    public static void validateTextInputAndProperties(
            Map<String, Object> formData, String key, List<String> properties) {
        if (!formData.containsKey(key) || !(formData.get(key) instanceof Map)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "input is not provided");
        }
        Map<String, Object> inputMap = (Map<String, Object>) formData.get(key);

        if (!inputMap.containsKey(INPUT)
                || !StringUtils.hasLength(RequestUtils.extractDataFromFormData(inputMap, INPUT))) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "input is not provided");
        }
        for (String property : properties) {
            if (!inputMap.containsKey(property)) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, property + " is not provided");
            }
        }
    }
}
