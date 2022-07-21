package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomConfigRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomConfigRepositoryImpl extends CustomConfigRepositoryCEImpl implements CustomConfigRepository {

    public CustomConfigRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
