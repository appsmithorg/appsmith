package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomUserGroupRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomUserGroupRepositoryImpl extends CustomUserGroupRepositoryCEImpl
        implements CustomUserGroupRepository {

    public CustomUserGroupRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
