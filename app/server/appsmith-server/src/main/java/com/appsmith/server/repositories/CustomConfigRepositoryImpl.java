package com.appsmith.server.repositories;

import com.appsmith.server.domains.Config;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomConfigRepositoryImpl extends BaseAppsmithRepositoryImpl<Config> implements CustomConfigRepository {


    public CustomConfigRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
