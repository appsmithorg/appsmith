package com.appsmith.server.repositories;

import com.appsmith.server.domains.QUser;
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
                .updateFirst(
                        query(where("userId").is(userId)),
                        Update.update(fieldName(QUser.user.releaseNotesViewedVersion), version),
                        UserData.class
                );
    }

}
