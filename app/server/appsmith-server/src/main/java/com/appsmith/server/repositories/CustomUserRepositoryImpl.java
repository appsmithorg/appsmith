package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepository {

    public CustomUserRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<User> findByEmail(String email, AclPermission aclPermission) {
        Criteria emailCriteria = where(fieldName(QUser.user.email)).is(email);

        return queryOne(List.of(emailCriteria), aclPermission);
    }

    @Override
    public Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version) {
        return mongoOperations
                .updateFirst(
                        query(where("id").is(userId)),
                        Update.update(fieldName(QUser.user.releaseNotesViewedVersion), version),
                        User.class
                );
    }

}
