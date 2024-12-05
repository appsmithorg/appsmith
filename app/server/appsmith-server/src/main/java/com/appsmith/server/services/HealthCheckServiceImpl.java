package com.appsmith.server.services;

import com.appsmith.server.services.ce.HealthCheckServiceCEImpl;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component
public class HealthCheckServiceImpl extends HealthCheckServiceCEImpl implements HealthCheckService {
    public HealthCheckServiceImpl(
            ReactiveRedisConnectionFactory reactiveRedisConnectionFactory,
            ObservationRegistry observationRegistry) {
        super(reactiveRedisConnectionFactory, observationRegistry);
    }
}
