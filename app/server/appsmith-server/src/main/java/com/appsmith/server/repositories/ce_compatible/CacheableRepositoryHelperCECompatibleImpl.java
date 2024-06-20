package com.appsmith.server.repositories.ce_compatible;

import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCEImpl;
import io.micrometer.observation.ObservationRegistry;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CacheableRepositoryHelperCECompatibleImpl extends CacheableRepositoryHelperCEImpl
        implements CacheableRepositoryHelperCECompatible {
    public CacheableRepositoryHelperCECompatibleImpl(
            EntityManager entityManager,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper,
            ObservationRegistry observationRegistry) {
        super(entityManager, inMemoryCacheableRepositoryHelper, observationRegistry);
    }
}
