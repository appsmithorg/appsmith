package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomConfigRepositoryCEImpl;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Component;

@Component
public class CustomConfigRepositoryImpl extends CustomConfigRepositoryCEImpl implements CustomConfigRepository {
    private final ObservationRegistry observationRegistry;

    public CustomConfigRepositoryImpl(ObservationRegistry observationRegistry) {
        super(observationRegistry);
        this.observationRegistry = observationRegistry;
    }
}
