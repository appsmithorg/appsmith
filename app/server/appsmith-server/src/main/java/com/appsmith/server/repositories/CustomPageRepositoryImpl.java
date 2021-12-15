package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPageRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomPageRepositoryImpl extends CustomPageRepositoryCEImpl
        implements CustomPageRepository {

    public CustomPageRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
