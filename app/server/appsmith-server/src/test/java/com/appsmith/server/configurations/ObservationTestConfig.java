package com.appsmith.server.configurations;

import com.appsmith.external.helpers.ObservationHelper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObservationTestConfig {

    @Bean
    public ObservationHelper observationHelper() {
        return ObservationHelper.NOOP;
    }
}
