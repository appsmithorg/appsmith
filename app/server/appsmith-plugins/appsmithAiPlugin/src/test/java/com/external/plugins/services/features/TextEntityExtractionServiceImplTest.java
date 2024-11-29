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
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_ENTITY_EXTRACTION;
import static org.junit.jupiter.api.Assertions.*;

class TextEntityExtractionServiceImplTest {

    @Test
    void testCreateQuery_ValidInput() {
        TextEntityExtractionServiceImpl textEntityExtractionService = new TextEntityExtractionServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(
                TEXT_ENTITY_EXTRACTION,
                Map.of(
                        INPUT,
                        Map.of(DATA, "Some text"),
                        LABELS,
                        Map.of(DATA, "label1, label2"),
                        INSTRUCTIONS,
                        Map.of(DATA, "Some instructions")));
        actionConfiguration.setFormData(formData);

        Query query = textEntityExtractionService.createQuery(
                actionConfiguration, datasourceConfiguration, new ExecuteActionDTO());

        assertNotNull(query);
        assertEquals("Some text", query.getInput());
        assertEquals(Arrays.asList("label1", "label2"), query.getLabels());
        assertEquals("Some instructions", query.getInstructions());
    }

    @Test
    void testCreateQuery_MissingTextInput() {
        TextEntityExtractionServiceImpl textEntityExtractionService = new TextEntityExtractionServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        // Missing TEXT_ENTITY_INPUT
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> textEntityExtractionService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }
}
