package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.helpers.ce.PluginUtilsCEImpl;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PluginService;
import org.springframework.stereotype.Component;

@Component
public class PluginUtilsImpl extends PluginUtilsCEImpl implements PluginUtils {

    public PluginUtilsImpl(ConfigService configService,
                           PluginService pluginService,
                           CloudServicesConfig cloudServicesConfig) {

        super(configService, pluginService, cloudServicesConfig);
    }

}
