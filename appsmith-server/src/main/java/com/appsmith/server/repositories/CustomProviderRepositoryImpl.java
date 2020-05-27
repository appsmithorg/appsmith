package com.appsmith.server.repositories;

import com.appsmith.external.models.Provider;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomProviderRepositoryImpl extends BaseAppsmithRepositoryImpl<Provider> implements CustomProviderRepository {

    public CustomProviderRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
