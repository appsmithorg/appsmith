package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.QNotification;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

public class CustomNotificationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Notification>
        implements CustomNotificationRepositoryCE {

    public CustomNotificationRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
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
