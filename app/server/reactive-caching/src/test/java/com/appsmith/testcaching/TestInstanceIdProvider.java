package com.appsmith.testcaching;

import com.appsmith.caching.components.InstanceIdProvider;
import reactor.core.publisher.Mono;

public class TestInstanceIdProvider implements InstanceIdProvider {

    private static final String TEST_INSTANCE_ID = "test-instance-123";

    @Override
    public Mono<String> getInstanceId() {
        return Mono.just(TEST_INSTANCE_ID);
    }
}
