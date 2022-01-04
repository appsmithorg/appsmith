package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomProviderRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomProviderRepositoryImpl extends CustomProviderRepositoryCEImpl implements CustomProviderRepository {

    public CustomProviderRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
