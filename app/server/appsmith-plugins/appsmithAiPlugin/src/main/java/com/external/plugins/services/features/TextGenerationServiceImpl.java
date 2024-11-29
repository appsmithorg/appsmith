package com.external.plugins.services.features;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.dtos.Query;
import com.external.plugins.services.AiFeatureService;
import com.external.plugins.utils.FileUtils;
import org.apache.commons.collections.ListUtils;

import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_GENERATION;
import static com.external.plugins.constants.AppsmithAiConstants.TEXT_GENERATION_INPUT;
import static com.external.plugins.utils.FieldValidationHelper.validateTextInput;

public class TextGenerationServiceImpl implements AiFeatureService {
    @Override
    public Query createQuery(
            ActionConfiguration actionConfiguration,
            DatasourceConfiguration datasourceConfiguration,
            ExecuteActionDTO executeActionDTO) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        validateTextInput(formData, TEXT_GENERATION);
        String input = PluginUtils.getDataValueSafelyFromFormData(formData, TEXT_GENERATION_INPUT, STRING_TYPE);
        Query query = new Query();
        query.setInput(input);
        query.setFileIds(getCommonFileIds(actionConfiguration, datasourceConfiguration));
        return query;
    }

    /**
     * Sometimes it's possible that action configuration file context selection may have some deleted files which are not present
     * in datasource configuration, so we should avoid those files and only send those which are present in datasource configuration
     */
    private List<String> getCommonFileIds(
            ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        return ListUtils.intersection(
                FileUtils.getFileIds(actionConfiguration), FileUtils.getFileIds(datasourceConfiguration));
    }
}
