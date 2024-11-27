package com.external.plugins.services.features;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.services.AiFeatureService;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_SUMMARY;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_SUMMARY_INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_SUMMARY_INSTRUCTIONS;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInput;

public class TextSummarizationServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(
            ActionConfiguration actionConfiguration,
            DatasourceConfiguration datasourceConfiguration,
            ExecuteActionDTO executeActionDTO) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInput(formData, TEXT_SUMMARY);
        String input = PluginUtils.getDataValueSafelyFromFormData(formData, TEXT_SUMMARY_INPUT, STRING_TYPE);
        String instrctions =
                PluginUtils.getDataValueSafelyFromFormData(formData, TEXT_SUMMARY_INSTRUCTIONS, STRING_TYPE);
        Query query = new Query();
        query.setInput(input);
        query.setInstructions(instrctions);
        return query;
    }
}
