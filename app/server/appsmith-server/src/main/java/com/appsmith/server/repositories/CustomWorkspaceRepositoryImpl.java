package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomWorkspaceRepositoryImpl extends CustomWorkspaceRepositoryCEImpl
        implements CustomWorkspaceRepository {

    public CustomWorkspaceRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
