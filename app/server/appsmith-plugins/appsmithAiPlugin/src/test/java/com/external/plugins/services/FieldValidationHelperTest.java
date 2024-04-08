package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.utils.FieldValidationHelper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class FieldValidationHelperTest {

    @Test
    void testValidateTextInput_ValidInput() {
        Map<String, Object> formData = new HashMap<>();
        formData.put("imageCaptionService", Map.of(INPUT, Map.of(DATA, "value")));

        assertDoesNotThrow(() -> FieldValidationHelper.validateTextInput(formData, "imageCaptionService"));
    }

    @Test
    void testValidateTextInput_MissingKey() {
        Map<String, Object> formData = new HashMap<>();

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class, () -> FieldValidationHelper.validateTextInput(formData, "key"));

        assertEquals("input is not provided", exception.getMessage());
    }

    @Test
    void testValidateTextInput_InvalidInputType() {
        Map<String, Object> formData = new HashMap<>();
        formData.put("key", "notAMap");

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class, () -> FieldValidationHelper.validateTextInput(formData, "key"));

        assertEquals("input is not provided", exception.getMessage());
    }

    @Test
    void testValidateTextInput_EmptyInput() {
        Map<String, Object> formData = new HashMap<>();
        formData.put("key", new HashMap<>());

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class, () -> FieldValidationHelper.validateTextInput(formData, "key"));

        assertEquals("input is not provided", exception.getMessage());
    }

    @Test
    void testValidateTextInputAndProperties_ValidInput() {
        Map<String, Object> formData = new HashMap<>();
        Map<String, Object> inputData = new HashMap<>();

        inputData.put("property1", "value1");
        inputData.put("property2", "value2");
        inputData.put(INPUT, Map.of(DATA, "value"));
        formData.put("imageCaptionService", inputData);

        List<String> properties = List.of("property1", "property2");

        assertDoesNotThrow(() ->
                FieldValidationHelper.validateTextInputAndProperties(formData, "imageCaptionService", properties));
    }

    @Test
    void testValidateTextInputAndProperties_MissingKey() {
        Map<String, Object> formData = new HashMap<>();
        List<String> properties = List.of("property1", "property2");

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> FieldValidationHelper.validateTextInputAndProperties(formData, "key", properties));

        assertEquals("input is not provided", exception.getMessage());
    }

    @Test
    void testValidateTextInputAndProperties_InvalidInputType() {
        Map<String, Object> formData = new HashMap<>();
        formData.put("key", "notAMap");

        List<String> properties = List.of("property1", "property2");

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> FieldValidationHelper.validateTextInputAndProperties(formData, "key", properties));

        assertEquals("input is not provided", exception.getMessage());
    }
}
