package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomNewActionRepositoryCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomNewActionRepositoryImpl extends CustomNewActionRepositoryCEImpl
        implements CustomNewActionRepository {

    public CustomNewActionRepositoryImpl(
            ReactiveMongoOperations mongoOperations, ObservationRegistry observationRegistry) {
        super(mongoOperations, observationRegistry);
    }
}
