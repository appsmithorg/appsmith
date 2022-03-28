package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomUserDataRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomUserDataRepositoryImpl extends CustomUserDataRepositoryCEImpl implements CustomUserDataRepository {

    public CustomUserDataRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
