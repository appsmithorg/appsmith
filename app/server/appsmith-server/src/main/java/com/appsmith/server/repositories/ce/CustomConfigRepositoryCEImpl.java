package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Config;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomConfigRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Config> implements CustomConfigRepositoryCE {


    public CustomConfigRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
