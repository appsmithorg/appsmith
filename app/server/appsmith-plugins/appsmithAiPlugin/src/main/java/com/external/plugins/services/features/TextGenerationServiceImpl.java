package com.external.plugins.services.features;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.services.AiFeatureService;
import com.external.plugins.utils.RequestUtils;

import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInput;

public class TextGenerationServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInput(formData);
        String input = RequestUtils.extractDataFromFormData(formData, INPUT);
        Query query = new Query();
        query.setInput(input);
        return query;
    }
}
