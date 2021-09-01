package com.appsmith.server.repositories;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.QNotification;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

public class CustomNotificationRepositoryImpl extends BaseAppsmithRepositoryImpl<Notification>
        implements CustomNotificationRepository {

    public CustomNotificationRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<UpdateResult> updateIsReadByForUsernameAndIdList(String forUsername, List<String> idList, boolean isRead) {
        return mongoOperations.updateMulti(
                query(where(fieldName(QNotification.notification.forUsername)).is(forUsername)
                        .and(fieldName(QNotification.notification.id)).in(idList)
                ),
                new Update().set(fieldName(QNotification.notification.isRead), isRead),
                Notification.class
        );
    }

    @Override
    public Mono<UpdateResult> updateIsReadByForUsername(String forUsername, boolean isRead) {
        return mongoOperations.updateMulti(
                query(where(fieldName(QNotification.notification.forUsername)).is(forUsername)),
                new Update().set(fieldName(QNotification.notification.isRead), isRead),
                Notification.class
        );
    }
}
