package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.helpers.ce.PluginScheduledTaskUtilsCEImpl;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PluginService;
import org.springframework.stereotype.Component;

@Component
public class PluginScheduledTaskUtilsImpl extends PluginScheduledTaskUtilsCEImpl implements PluginScheduledTaskUtils {

    public PluginScheduledTaskUtilsImpl(
            ConfigService configService, PluginService pluginService, CloudServicesConfig cloudServicesConfig) {

        super(configService, pluginService, cloudServicesConfig);
    }
}
