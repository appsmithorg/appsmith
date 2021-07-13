package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginTransformer;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;

public class AirtablePlugin extends BasePlugin {

    public AirtablePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class AirtablePluginExecutor implements PluginTransformer {

        @Override
        public ActionConfiguration transformAction(DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return null;
        }

        @Override
        public void validateAction(ActionConfiguration actionConfiguration) {

        }
    }
}
