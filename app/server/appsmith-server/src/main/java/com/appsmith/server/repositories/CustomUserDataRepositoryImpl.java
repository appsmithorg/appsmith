package com.appsmith.server.repositories;

import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.UserData;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Component
public class CustomUserDataRepositoryImpl extends BaseAppsmithRepositoryImpl<UserData> implements CustomUserDataRepository {

    public CustomUserDataRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version) {
        return mongoOperations
                .upsert(
                        query(where(fieldName(QUserData.userData.userId)).is(userId)),
                        Update
                                .update(fieldName(QUserData.userData.releaseNotesViewedVersion), version)
                                .setOnInsert(fieldName(QUserData.userData.userId), userId),
                        UserData.class
                );
    }

    @Override
    public Mono<UpdateResult> removeOrgFromRecentlyUsedList(String userId, String organizationId) {
        return mongoOperations.updateFirst(
                query(where(fieldName(QUserData.userData.userId)).is(userId)),
                new Update().pull(fieldName(QUserData.userData.recentlyUsedOrgIds), organizationId),
                UserData.class
                );
    }
}
