package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPermissionRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomPermissionRepositoryImpl extends CustomPermissionRepositoryCEImpl
        implements CustomPermissionRepository {

    public CustomPermissionRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
