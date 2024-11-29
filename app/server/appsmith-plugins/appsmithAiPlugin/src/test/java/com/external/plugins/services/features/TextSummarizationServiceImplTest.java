package com.external.plugins.services.features;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.INSTRUCTIONS;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_SUMMARY;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_SUMMARY_INPUT;
import static org.junit.jupiter.api.Assertions.*;

class TextSummarizationServiceImplTest {

    @Test
    void testCreateQuery_ValidInput() {
        TextSummarizationServiceImpl textSummarizationService = new TextSummarizationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(
                TEXT_SUMMARY,
                Map.of(INPUT, Map.of(DATA, "Some text"), INSTRUCTIONS, Map.of(DATA, "Some instructions")));
        actionConfiguration.setFormData(formData);

        Query query = textSummarizationService.createQuery(
                actionConfiguration, datasourceConfiguration, new ExecuteActionDTO());

        assertNotNull(query);
        assertEquals("Some text", query.getInput());
        assertEquals("Some instructions", query.getInstructions());
    }

    @Test
    void testCreateQuery_MissingTextInput() {
        TextSummarizationServiceImpl textSummarizationService = new TextSummarizationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        // Missing TEXT_SUMMARY_INPUT
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> textSummarizationService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }

    @Test
    void testCreateQuery_EmptyTextInput() {
        TextSummarizationServiceImpl textSummarizationService = new TextSummarizationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(TEXT_SUMMARY, Map.of(TEXT_SUMMARY_INPUT, ""));
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> textSummarizationService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }
}
