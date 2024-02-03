package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCEImpl;
import jakarta.persistence.EntityManager;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomPermissionGroupRepositoryImpl extends CustomPermissionGroupRepositoryCEImpl
        implements CustomPermissionGroupRepository {

    public CustomPermissionGroupRepositoryImpl(
            EntityManager entityManager,
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(entityManager, mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}
