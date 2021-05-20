package com.appsmith.server.repositories;

import com.appsmith.server.domains.Notification;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomNotificationRepositoryImpl extends BaseAppsmithRepositoryImpl<Notification> implements CustomNotificationRepository {

    public CustomNotificationRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
