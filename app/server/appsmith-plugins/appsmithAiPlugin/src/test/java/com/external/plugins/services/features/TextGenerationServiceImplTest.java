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
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_GENERATION;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_GENERATION_INPUT;
import static org.junit.jupiter.api.Assertions.*;

class TextGenerationServiceImplTest {

    @Test
    void testCreateQuery_ValidInput() {
        TextGenerationServiceImpl textGenerationService = new TextGenerationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(TEXT_GENERATION, Map.of(INPUT, Map.of(DATA, "Hello, World!")));
        actionConfiguration.setFormData(formData);

        Query query =
                textGenerationService.createQuery(actionConfiguration, datasourceConfiguration, new ExecuteActionDTO());

        assertNotNull(query);
        assertEquals("Hello, World!", query.getInput());
    }

    @Test
    void testCreateQuery_MissingTextInput() {
        TextGenerationServiceImpl textGenerationService = new TextGenerationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        // Missing TEXT_GENERATION_INPUT
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> textGenerationService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }

    @Test
    void testCreateQuery_EmptyTextInput() {
        TextGenerationServiceImpl textGenerationService = new TextGenerationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(TEXT_GENERATION, Map.of(TEXT_GENERATION_INPUT, ""));
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> textGenerationService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }
}
