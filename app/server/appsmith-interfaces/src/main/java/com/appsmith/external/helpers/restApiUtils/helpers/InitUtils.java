package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor
public class InitUtils {

    public String initializeRequestUrl(ActionConfiguration actionConfiguration,
                                            DatasourceConfiguration datasourceConfiguration ) {
        String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
        return datasourceConfiguration.getUrl() + path;
    }

    public void initializeResponseWithError(ActionExecutionResult result) {
        result.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
        result.setIsExecutionSuccess(false);
        result.setTitle(AppsmithPluginError.PLUGIN_ERROR.getTitle());
    }
}
