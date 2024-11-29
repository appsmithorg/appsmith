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
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CLASSIFICATION;
import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.INSTRUCTIONS;
import static com.external.plugins.constants.AppsmithAiConstants.LABELS;
import static org.junit.jupiter.api.Assertions.*;

class ImageClassificationServiceImplTest {

    @Test
    void testCreateQuery_ValidInput() {
        ImageClassificationServiceImpl imageClassificationService = new ImageClassificationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();

        // Use DATA key for INPUT, LABELS, and INSTRUCTIONS
        formData.put(
                IMAGE_CLASSIFICATION,
                Map.of(
                        INPUT, Map.of(DATA, "Some image data"),
                        LABELS, Map.of(DATA, "label1, label2"),
                        INSTRUCTIONS, Map.of(DATA, "Some instructions")));
        actionConfiguration.setFormData(formData);

        Query query = imageClassificationService.createQuery(
                actionConfiguration, datasourceConfiguration, new ExecuteActionDTO());

        assertNotNull(query);
        assertEquals("Some image data", query.getInput());
        assertEquals(Arrays.asList("label1", "label2"), query.getLabels());
        assertEquals("Some instructions", query.getInstructions());
    }

    @Test
    void testCreateQuery_MissingImageInput() {
        ImageClassificationServiceImpl imageClassificationService = new ImageClassificationServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        // Missing IMAGE_CLASSIFY_INPUT
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> imageClassificationService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }
}
