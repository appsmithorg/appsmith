package com.appsmith.server.repositories.ce_compatible;

import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCEImpl;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CacheableRepositoryHelperCECompatibleImpl extends CacheableRepositoryHelperCEImpl
        implements CacheableRepositoryHelperCECompatible {
    public CacheableRepositoryHelperCECompatibleImpl(
            ReactiveMongoOperations mongoOperations,
            EntityManager entityManager,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        super(mongoOperations, entityManager, inMemoryCacheableRepositoryHelper);
    }
}
