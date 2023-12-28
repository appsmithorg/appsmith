package com.external.plugins.services.features;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.dtos.TextEntityExtractionQuery;
import com.external.plugins.services.AiFeatureService;
import com.external.plugins.utils.RequestUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.LABELS;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInputAndProperties;

public class TextEntityExtractionServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInputAndProperties(formData, List.of(LABELS));
        String input = RequestUtils.extractDataFromFormData(formData, INPUT);
        String entities = RequestUtils.extractDataFromFormData(formData, LABELS);
        // labels string is comma-separated list of labels
        List<String> entitiesList =
                Arrays.stream(entities.split(",")).map(String::trim).toList();
        TextEntityExtractionQuery query = new TextEntityExtractionQuery();
        query.setInput(input);
        query.setLabels(entitiesList);
        return query;
    }
}
