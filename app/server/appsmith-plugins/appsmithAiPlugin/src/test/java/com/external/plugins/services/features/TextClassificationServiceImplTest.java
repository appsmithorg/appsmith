package com.external.plugins.services.features;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.INSTRUCTIONS;
import static com.external.plugins.constants.AppsmithAiConstants.LABELS;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_CLASSIFICATION;
import static org.junit.jupiter.api.Assertions.*;

class TextClassificationServiceImplTest {

    @Test
    void testCreateQuery_ValidInput() {
        TextClassificationServiceImpl textClassificationService = new TextClassificationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();

        // Use DATA key for INPUT, LABELS, and INSTRUCTIONS
        formData.put(
                TEXT_CLASSIFICATION,
                Map.of(
                        INPUT, Map.of(DATA, "Some text"),
                        LABELS, Map.of(DATA, "label1, label2"),
                        INSTRUCTIONS, Map.of(DATA, "Some instructions")));
        actionConfiguration.setFormData(formData);

        Query query = textClassificationService.createQuery(
                actionConfiguration, datasourceConfiguration, new ExecuteActionDTO());

        assertNotNull(query);
        assertEquals("Some text", query.getInput());
        assertEquals(Arrays.asList("label1", "label2"), query.getLabels());
        assertEquals("Some instructions", query.getInstructions());
    }

    @Test
    void testCreateQuery_MissingTextInput() {
        TextClassificationServiceImpl textClassificationService = new TextClassificationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        // Missing TEXT_CLASSIFY_INPUT
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> textClassificationService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }

    // Additional test cases can be added to cover more scenarios
}
