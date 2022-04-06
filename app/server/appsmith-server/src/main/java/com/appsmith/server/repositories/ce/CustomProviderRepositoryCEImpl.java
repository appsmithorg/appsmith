package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Provider;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomProviderRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Provider> implements CustomProviderRepositoryCE {

    public CustomProviderRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
