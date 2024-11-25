package com.external.plugins.services.features;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.services.AiFeatureService;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CAPTIONING;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CAPTION_INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CAPTION_INSTRUCTIONS;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInput;

public class ImageCaptioningServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(
            ActionConfiguration actionConfiguration,
            DatasourceConfiguration datasourceConfiguration,
            ExecuteActionDTO executeActionDTO) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInput(formData, IMAGE_CAPTIONING);
        String input = PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_CAPTION_INPUT, STRING_TYPE);
        String instructions =
                PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_CAPTION_INSTRUCTIONS, STRING_TYPE);
        Query query = new Query();
        query.setInput(input);
        query.setInstructions(instructions);
        return query;
    }
}
