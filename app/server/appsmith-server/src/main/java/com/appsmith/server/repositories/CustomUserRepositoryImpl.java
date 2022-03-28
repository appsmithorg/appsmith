package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomUserRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends CustomUserRepositoryCEImpl implements CustomUserRepository {

    public CustomUserRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
