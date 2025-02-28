package com.appsmith.server.repositories.ce_compatible;

import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CacheableRepositoryHelperCECompatibleImpl extends CacheableRepositoryHelperCEImpl
        implements CacheableRepositoryHelperCECompatible {
    public CacheableRepositoryHelperCECompatibleImpl(
            ReactiveMongoOperations mongoOperations, ObservationRegistry observationRegistry) {
        super(mongoOperations, observationRegistry);
    }
}
