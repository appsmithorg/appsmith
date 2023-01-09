package com.appsmith.server.repositories.ce;


import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.external.models.Environment;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

@Slf4j
public class CustomEnvironmentRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Environment>
        implements CustomEnvironmentRepositoryCE {

    public CustomEnvironmentRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

}
