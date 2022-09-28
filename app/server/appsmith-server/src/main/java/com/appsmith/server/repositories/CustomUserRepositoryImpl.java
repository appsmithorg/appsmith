package com.appsmith.server.repositories;

import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ce.CustomUserRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends CustomUserRepositoryCEImpl implements CustomUserRepository {

    public CustomUserRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<String> getAllUserEmail() {
        Query query = new Query();
        query.fields().include(fieldName(QUser.user.email));
        return mongoOperations.find(query, User.class).map(User::getEmail);
    }
}
