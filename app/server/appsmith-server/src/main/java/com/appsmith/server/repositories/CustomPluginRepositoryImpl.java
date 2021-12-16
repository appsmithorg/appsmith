package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPluginRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomPluginRepositoryImpl extends CustomPluginRepositoryCEImpl implements CustomPluginRepository {

    public CustomPluginRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
