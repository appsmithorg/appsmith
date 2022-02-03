package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomNotificationRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomNotificationRepositoryImpl extends CustomNotificationRepositoryCEImpl
        implements CustomNotificationRepository {

    public CustomNotificationRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
