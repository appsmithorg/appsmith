package com.appsmith.server.repositories;

import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.ce_compatible.CacheableRepositoryHelperCECompatibleImpl;
import io.micrometer.observation.ObservationRegistry;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Component;

@Component
public class CacheableRepositoryHelperImpl extends CacheableRepositoryHelperCECompatibleImpl
        implements CacheableRepositoryHelper {

    public CacheableRepositoryHelperImpl(
            EntityManager entityManager,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper,
            ObservationRegistry observationRegistry) {
        super(entityManager, inMemoryCacheableRepositoryHelper, observationRegistry);
    }
}
