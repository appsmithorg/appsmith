package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.QDatasourceStorage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomDatasourceStorageRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceStorage>
        implements CustomDatasourceStorageRepositoryCE {


    public CustomDatasourceStorageRepositoryCEImpl(ReactiveMongoOperations mongoOperations,
                                                   MongoConverter mongoConverter,
                                                   CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}
