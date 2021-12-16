package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomActionRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomActionRepositoryImpl extends CustomActionRepositoryCEImpl implements CustomActionRepository {

    public CustomActionRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
