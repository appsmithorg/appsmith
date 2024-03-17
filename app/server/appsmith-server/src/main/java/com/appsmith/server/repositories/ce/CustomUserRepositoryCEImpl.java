package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

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
        BridgeQuery<User> emailCriteria = Bridge.equal(User.Fields.email, email);
        return queryBuilder().criteria(emailCriteria).permission(aclPermission).one();
    }

    @Override
    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        return queryBuilder()
                .criteria(Bridge.equal(User.Fields.email, email).equal(User.Fields.tenantId, tenantId))
                .one();
    }

    /**
     * Fetch minimal information from *a* user document in the database, limit to two documents, filter anonymousUser
     * If no documents left return true otherwise return false.
     *
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Mono<Boolean> isUsersEmpty() {
        return queryBuilder()
                .fields(User.Fields.email)
                // Basically limit to system generated emails plus 1 more.
                .limit(getSystemGeneratedUserEmails().size() + 1)
                .all()
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
