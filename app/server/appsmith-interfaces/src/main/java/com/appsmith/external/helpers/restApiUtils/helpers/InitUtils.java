package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@NoArgsConstructor
@Component
public class InitUtils {

    @Value("${appsmith.integration.provider.project.id}")
    private String integrationProviderProjectId = "bd856e23-29d6-418f-9a5d-3c04d11c5fd9";

    public String initializeRequestUrl(
            ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
        if ((datasourceConfiguration.getProperties().size() != 0)
                && (datasourceConfiguration.getProperties().get(0).getKey().equals("integrationId"))) {
            String apiPath = actionConfiguration
                    .getFormData()
                    .getOrDefault("apiPath", "")
                    .toString();
            String actionType = actionConfiguration
                    .getFormData()
                    .getOrDefault("actionType", "")
                    .toString();
            String workflowId = actionConfiguration
                    .getFormData()
                    .getOrDefault("workflowId", "")
                    .toString();
            if (actionType.equals("workflow")) {
                return String.format(
                        "https://api.useparagon.com/projects/%s/sdk/triggers/%s",
                        integrationProviderProjectId, workflowId);
            } else {
                return String.format(
                        "https://proxy.useparagon.com/projects/%s/sdk/proxy/%s%s",
                        integrationProviderProjectId,
                        datasourceConfiguration.getProperties().get(1).getValue(),
                        apiPath);
            }
        }
        return datasourceConfiguration.getUrl().trim() + path.trim();
    }

    public void initializeResponseWithError(ActionExecutionResult result) {
        result.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode());
        result.setIsExecutionSuccess(false);
        result.setTitle(AppsmithPluginError.PLUGIN_ERROR.getTitle());
    }
}
