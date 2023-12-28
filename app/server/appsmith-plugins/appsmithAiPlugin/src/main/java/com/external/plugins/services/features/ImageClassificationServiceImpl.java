package com.external.plugins.services.features;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.dtos.TextClassificationQuery;
import com.external.plugins.services.AiFeatureService;
import com.external.plugins.utils.RequestUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.INSTRUCTIONS;
import static com.external.plugins.constants.AppsmithAiConstants.LABELS;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInputAndProperties;

public class ImageClassificationServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInputAndProperties(formData, List.of(LABELS));
        String input = RequestUtils.extractDataFromFormData(formData, INPUT);
        String labels = RequestUtils.extractDataFromFormData(formData, LABELS);
        String instructions = RequestUtils.extractDataFromFormData(formData, INSTRUCTIONS);
        // labels string is comma-separated list of labels
        List<String> labelsList =
                Arrays.stream(labels.split(",")).map(String::trim).toList();
        TextClassificationQuery query = new TextClassificationQuery();
        query.setInput(input);
        query.setLabels(labelsList);
        query.setInstructions(instructions);
        return query;
    }
}
