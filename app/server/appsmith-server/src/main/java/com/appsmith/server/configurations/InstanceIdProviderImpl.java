package com.appsmith.server.configurations;

import com.appsmith.caching.components.InstanceIdProvider;
import com.appsmith.server.services.ConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class InstanceIdProviderImpl implements InstanceIdProvider {

    private final ConfigService configService;

    @Override
    public Mono<String> getInstanceId() {
        return configService.getInstanceId();
    }
}
