package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.regex.Pattern;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    public CustomUserRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<User> findByEmail(String email, AclPermission aclPermission) {
        Criteria emailCriteria = where(fieldName(QUser.user.email)).is(email);
        return queryOne(List.of(emailCriteria), aclPermission);
    }

    @Override
    public Mono<User> findByCaseInsensitiveEmail(String email) {
        String findEmailRegex = String.format("^%s$", Pattern.quote(email));
        Criteria emailCriteria = where(fieldName(QUser.user.email)).regex(findEmailRegex, "i");
        Query query = new Query();
        query.addCriteria(emailCriteria);
        return mongoOperations.findOne(query, User.class);
    }

    /**
     * Fetch minmal information from *a* user document in the database, and if found, return `true`, if empty, return `false`.
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Mono<Boolean> isUsersEmpty() {
        final Query q = query(new Criteria());
        q.fields().include(fieldName(QUser.user.email));
        return mongoOperations.findOne(q, User.class)
                .map(ignored -> false)
                .defaultIfEmpty(true);
    }

}
