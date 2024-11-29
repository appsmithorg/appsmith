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
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_ENTITY_EXTRACTION;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_ENTITY_INPUT;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_ENTITY_INSTRUCTIONS;
import static com.external.plugins.constants.AppsmithAiConstants.IMAGE_ENTITY_LABELS;
import static com.external.plugins.constants.AppsmithAiConstants.LABELS;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInputAndProperties;

public class ImageEntityExtractionServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(
            ActionConfiguration actionConfiguration,
            DatasourceConfiguration datasourceConfiguration,
            ExecuteActionDTO executeActionDTO) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInputAndProperties(formData, IMAGE_ENTITY_EXTRACTION, List.of(LABELS));
        String input = PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_ENTITY_INPUT, STRING_TYPE);
        String entities = PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_ENTITY_LABELS, STRING_TYPE);
        String instructions =
                PluginUtils.getDataValueSafelyFromFormData(formData, IMAGE_ENTITY_INSTRUCTIONS, STRING_TYPE);
        // labels string is comma-separated list of labels
        List<String> entitiesList =
                Arrays.stream(entities.split(",")).map(String::trim).toList();
        Query query = new Query();
        query.setInput(input);
        query.setLabels(entitiesList);
        query.setInstructions(instructions);
        return query;
    }
}
