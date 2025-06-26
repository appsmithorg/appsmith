package com.appsmith.testcaching;

import com.appsmith.caching.components.InstanceIdProvider;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestConfig {

    @Bean
    public InstanceIdProvider instanceIdProvider() {
        return new TestInstanceIdProvider();
    }
}
