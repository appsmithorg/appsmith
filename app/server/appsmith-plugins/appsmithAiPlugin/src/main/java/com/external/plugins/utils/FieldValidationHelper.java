package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.INPUT;

public class FieldValidationHelper {
    public static void validateTextInput(Map<String, Object> formData) {
        if (!formData.containsKey(INPUT)
                || !StringUtils.hasLength(RequestUtils.extractDataFromFormData(formData, INPUT))) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "input is not provided");
        }
    }

    public static void validateTextInputAndProperties(Map<String, Object> formData, List<String> properties) {
        if (!formData.containsKey(INPUT)
                || !StringUtils.hasLength(RequestUtils.extractDataFromFormData(formData, INPUT))) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "input is not provided");
        }
        for (String property : properties) {
            if (!formData.containsKey(property)) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, property + " is not provided");
            }
        }
    }
}
