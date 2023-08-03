package com.appsmith.server.repositories;

import com.appsmith.server.domains.QUserApiKey;
import com.appsmith.server.domains.UserApiKey;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

public class CustomApiKeyRepositoryImpl extends BaseAppsmithRepositoryImpl<UserApiKey>
        implements CustomApiKeyRepository {
    public CustomApiKeyRepositoryImpl(
            CacheableRepositoryHelper cacheableRepositoryHelper,
            MongoConverter mongoConverter,
            ReactiveMongoOperations mongoOperations) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<UserApiKey> getByUserIdWithoutPermission(String userId) {
        Criteria criteriaUserId =
                Criteria.where(fieldName(QUserApiKey.userApiKey.userId)).is(userId);
        return queryAll(List.of(criteriaUserId), Optional.empty());
    }
}
