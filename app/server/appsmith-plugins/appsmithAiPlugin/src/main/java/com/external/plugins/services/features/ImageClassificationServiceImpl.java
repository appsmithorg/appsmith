package com.external.plugins.services.features;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.services.AiFeatureService;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CLASSIFICATION;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CLASSIFY_INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CLASSIFY_INSTRUCTIONS;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_CLASSIFY_LABELS;
import static com.external.plugins.constants.AppsmithAiConstants.LABELS;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInputAndProperties;

public class ImageClassificationServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(
            ActionConfiguration actionConfiguration,
            DatasourceConfiguration datasourceConfiguration,
            ExecuteActionDTO executeActionDTO) {

        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInputAndProperties(formData, IMAGE_CLASSIFICATION, List.of(LABELS));
        String input = PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_CLASSIFY_INPUT, STRING_TYPE);
        String labels = PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_CLASSIFY_LABELS, STRING_TYPE);
        String instructions =
                PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_CLASSIFY_INSTRUCTIONS, STRING_TYPE);
        // labels string is comma-separated list of labels
        List<String> labelsList =
                Arrays.stream(labels.split(",")).map(String::trim).toList();
        Query query = new Query();
        query.setInput(input);
        query.setLabels(labelsList);
        query.setInstructions(instructions);
        return query;
    }
}
