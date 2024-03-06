package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.helpers.ce.NetworkUtilsCE;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class NetworkUtils extends NetworkUtilsCE {

    private final AirgapInstanceConfig airgapInstanceConfig;

    public NetworkUtils(AirgapInstanceConfig airgapInstanceConfig) {
        this.airgapInstanceConfig = airgapInstanceConfig;
    }

    @Override
    public Mono<String> getExternalAddress() {
        if (airgapInstanceConfig.isAirgapEnabled()) {
            return Mono.just(FALLBACK_IP);
        }
        return super.getExternalAddress();
    }
}
