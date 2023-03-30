package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.ce.PluginScheduledTaskCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;


@Slf4j
@Component
public class PluginScheduledTaskImpl extends PluginScheduledTaskCEImpl implements PluginScheduledTask {

    public PluginScheduledTaskImpl(ConfigService configService,
                                   PluginService pluginService,
                                   CloudServicesConfig cloudServicesConfig,
                                   CommonConfig commonConfig) {

        super(configService, pluginService, cloudServicesConfig, commonConfig);
    }
}
