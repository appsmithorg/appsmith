package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import lombok.NoArgsConstructor;

@NoArgsConstructor
public class InitUtils {

    public String initializeRequestUrl(
            ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
        if ((datasourceConfiguration.getProperties().size() > 2)
                && (datasourceConfiguration.getProperties().get(2).getKey().equals("credentialId"))) {
            String credentialId =
                    (String) datasourceConfiguration.getProperties().get(2).getValue();
            return String.format("https://embedded.runalloy.com/2024-03/passthrough?credentialId=%s", credentialId);
        }
        return datasourceConfiguration.getUrl().trim() + path.trim();
    }

    public void initializeResponseWithError(ActionExecutionResult result) {
        result.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode());
        result.setIsExecutionSuccess(false);
        result.setTitle(AppsmithPluginError.PLUGIN_ERROR.getTitle());
    }
}
