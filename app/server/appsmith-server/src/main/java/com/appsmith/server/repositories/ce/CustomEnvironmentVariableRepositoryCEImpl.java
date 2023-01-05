package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;


@Slf4j
public class CustomEnvironmentVariableRepositoryCEImpl extends BaseAppsmithRepositoryImpl<EnvironmentVariable> implements CustomEnvironmentVariableRepositoryCE {

    @Autowired
    public CustomEnvironmentVariableRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

}
