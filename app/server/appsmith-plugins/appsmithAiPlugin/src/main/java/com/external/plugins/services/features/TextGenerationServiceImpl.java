package com.external.plugins.services.features;

import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.services.AiFeatureService;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_GENERATION;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_GENERATION_INPUT;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInput;

public class TextGenerationServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInput(formData, TEXT_GENERATION);
        String input = PluginUtils.getDataValueSafelyFromFormData(formData, TEXT_GENERATION_INPUT, STRING_TYPE);
        Query query = new Query();
        query.setInput(input);
        return query;
    }
}
