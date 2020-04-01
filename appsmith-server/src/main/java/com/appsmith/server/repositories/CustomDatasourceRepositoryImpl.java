package com.appsmith.server.repositories;

import com.appsmith.server.domains.Datasource;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomDatasourceRepositoryImpl extends BaseAppsmithRepositoryImpl<Datasource> implements CustomDatasourceRepository {

    public CustomDatasourceRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
