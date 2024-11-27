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
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CAPTIONING;
import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.INSTRUCTIONS;
import static org.junit.jupiter.api.Assertions.*;

class ImageCaptioningServiceImplTest {

    @Test
    void testCreateQuery_ValidInput() {
        ImageCaptioningServiceImpl imageCaptioningService = new ImageCaptioningServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();

        // Use DATA key for INPUT and INSTRUCTIONS
        formData.put(
                IMAGE_CAPTIONING,
                Map.of(
                        INPUT, Map.of(DATA, "Some image data"),
                        INSTRUCTIONS, Map.of(DATA, "Some instructions")));
        actionConfiguration.setFormData(formData);

        Query query = imageCaptioningService.createQuery(
                actionConfiguration, datasourceConfiguration, new ExecuteActionDTO());

        assertNotNull(query);
        assertEquals("Some image data", query.getInput());
        assertNull(query.getLabels()); // Assuming image captioning does not have labels
        assertEquals("Some instructions", query.getInstructions());
    }

    @Test
    void testCreateQuery_MissingImageInput() {
        ImageCaptioningServiceImpl imageCaptioningService = new ImageCaptioningServiceImpl();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Map<String, Object> formData = new HashMap<>();
        // Missing IMAGE_CAPTION_INPUT
        actionConfiguration.setFormData(formData);

        AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> imageCaptioningService.createQuery(
                        actionConfiguration, datasourceConfiguration, new ExecuteActionDTO()));

        assertEquals("input is not provided", exception.getMessage());
    }

    // Additional test cases can be added to cover more scenarios
}
