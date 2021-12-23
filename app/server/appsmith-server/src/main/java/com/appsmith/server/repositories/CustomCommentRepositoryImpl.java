package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomCommentRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomCommentRepositoryImpl extends CustomCommentRepositoryCEImpl implements CustomCommentRepository {

    public CustomCommentRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
