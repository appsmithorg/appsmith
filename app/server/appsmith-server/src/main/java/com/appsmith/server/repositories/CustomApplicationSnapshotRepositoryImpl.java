package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomApplicationSnapshotRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomApplicationSnapshotRepositoryImpl extends CustomApplicationSnapshotRepositoryCEImpl implements CustomApplicationSnapshotRepository {
    public CustomApplicationSnapshotRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}
