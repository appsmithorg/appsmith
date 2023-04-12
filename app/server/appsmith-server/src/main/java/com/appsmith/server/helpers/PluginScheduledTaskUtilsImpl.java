package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.helpers.ce.PluginScheduledTaskUtilsCEImpl;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PluginService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
public class PluginScheduledTaskUtilsImpl extends PluginScheduledTaskUtilsCEImpl implements PluginScheduledTaskUtils {

    private final AirgapInstanceConfig airgapInstanceConfig;

    public PluginScheduledTaskUtilsImpl(ConfigService configService,
                                        PluginService pluginService,
                                        CloudServicesConfig cloudServicesConfig,
                                        AirgapInstanceConfig airgapInstanceConfig) {
        super(configService, pluginService, cloudServicesConfig);
        this.airgapInstanceConfig = airgapInstanceConfig;
    }

    @Override
    public Mono<Void> fetchAndUpdateRemotePlugins(Instant lastUpdatedAt) {
        if (airgapInstanceConfig.isAirgapEnabled()) {
            return Mono.empty();
        }
        return super.fetchAndUpdateRemotePlugins(lastUpdatedAt);
    }

}
