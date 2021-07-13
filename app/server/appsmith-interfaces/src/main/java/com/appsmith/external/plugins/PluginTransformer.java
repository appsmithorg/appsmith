package com.appsmith.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;

public interface PluginTransformer {

    default ActionConfiguration transformAction(DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
        return actionConfiguration;
    }

    default void validateAction(ActionConfiguration actionConfiguration) {

    }
}
