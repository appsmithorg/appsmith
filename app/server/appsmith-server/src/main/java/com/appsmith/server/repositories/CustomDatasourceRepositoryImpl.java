package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomDatasourceRepositoryImpl extends CustomDatasourceRepositoryCEImpl implements CustomDatasourceRepository {

    public CustomDatasourceRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
