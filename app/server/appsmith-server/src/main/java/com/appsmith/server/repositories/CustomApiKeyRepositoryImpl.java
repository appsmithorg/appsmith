package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserApiKey;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomApiKeyRepositoryImpl extends BaseAppsmithRepositoryImpl<UserApiKey> implements CustomApiKeyRepository {
    public CustomApiKeyRepositoryImpl(CacheableRepositoryHelper cacheableRepositoryHelper,
                                      MongoConverter mongoConverter,
                                      ReactiveMongoOperations mongoOperations) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}
