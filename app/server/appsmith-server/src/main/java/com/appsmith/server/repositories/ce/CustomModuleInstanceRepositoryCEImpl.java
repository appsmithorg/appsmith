package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomModuleInstanceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ModuleInstance>
        implements CustomModuleInstanceRepositoryCE {

    public CustomModuleInstanceRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}
