package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomApiTemplateRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomApiTemplateRepositoryImpl extends CustomApiTemplateRepositoryCEImpl
        implements CustomApiTemplateRepository {

    public CustomApiTemplateRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
