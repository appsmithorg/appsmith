package com.appsmith.server.repositories;

import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.ce_compatible.CacheableRepositoryHelperCECompatibleImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.stereotype.Component;

@Component
public class CacheableRepositoryHelperImpl extends CacheableRepositoryHelperCECompatibleImpl
        implements CacheableRepositoryHelper {

    public CacheableRepositoryHelperImpl(
            ReactiveMongoOperations mongoOperations,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        super(mongoOperations, inMemoryCacheableRepositoryHelper);
    }
}
