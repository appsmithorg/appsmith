package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    public CustomUserRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<User> findByEmail(String email, AclPermission aclPermission) {
        Criteria emailCriteria = where(fieldName(QUser.user.email)).is(email);
        return queryOne(List.of(emailCriteria), aclPermission);
    }

    @Override
    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        Criteria emailCriteria = where(fieldName(QUser.user.email)).is(email);
        Criteria tenantIdCriteria = where(fieldName(QUser.user.tenantId)).is(tenantId);

        Criteria andCriteria = new Criteria();
        andCriteria.andOperator(emailCriteria, tenantIdCriteria);

        Query query = new Query();
        query.addCriteria(andCriteria);
        return mongoOperations.findOne(query, User.class);
    }

    /**
     * Fetch minmal information from *a* user document in the database, limit to two documents, filter anonymousUser
     * If no documents left return true otherwise return false.
     *
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Mono<Boolean> isUsersEmpty() {
        final Query q = query(new Criteria());
        q.fields().include(fieldName(QUser.user.email));
        // Basically limit to system generated emails plus 1 more.
        q.limit(getSystemGeneratedUserEmails().size() + 1);
        return mongoOperations
                .find(q, User.class)
                .filter(user -> !getSystemGeneratedUserEmails().contains(user.getEmail()))
                .count()
                .map(count -> count == 0);
    }

    protected Set<String> getSystemGeneratedUserEmails() {
        Set<String> systemGeneratedEmails = new HashSet<>();
        systemGeneratedEmails.add(FieldName.ANONYMOUS_USER);
        return systemGeneratedEmails;
    }
}
