package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.querydsl.core.types.dsl.StringPath;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    public CustomUserRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Optional<User> findByEmail(String email, AclPermission aclPermission) {
        Criteria emailCriteria = where("email").is(email);
        return queryOne(List.of(emailCriteria), aclPermission);
    }

    @Override
    public List<User> findAllByEmails(Set<String> emails) {
        return Collections.emptyList(); /*
        Criteria emailCriteria = where("email").in(emails);
        Query query = new Query();
        query.addCriteria(emailCriteria);
        return mongoOperations.find(query, User.class);*/
    }

    @Override
    public Optional<User> findByCaseInsensitiveEmail(String email) {
        return Optional.empty(); /*
        String findEmailRegex = String.format("^%s$", Pattern.quote(email));
        Criteria emailCriteria = where("email").regex(findEmailRegex, "i");
        Query query = new Query();
        query.addCriteria(emailCriteria);
        return mongoOperations.findOne(query, User.class);*/
    }

    @Override
    public Optional<User> findByEmailAndTenantId(String email, String tenantId) {
        return Optional.empty(); /*
        Criteria emailCriteria = where("email").is(email);
        Criteria tenantIdCriteria = where("tenantId").is(tenantId);

        Criteria andCriteria = new Criteria();
        andCriteria.andOperator(emailCriteria, tenantIdCriteria);

        Query query = new Query();
        query.addCriteria(andCriteria);
        return mongoOperations.findOne(query, User.class);*/
    }

    /**
     * Fetch minmal information from *a* user document in the database, limit to two documents, filter anonymousUser
     * If no documents left return true otherwise return false.
     *
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Optional<Boolean> isUsersEmpty() {
        return Optional.empty(); /*
        final Query q = query(new Criteria());
        q.fields().include("email");
        // Basically limit to system generated emails plus 1 more.
        q.limit(getSystemGeneratedUserEmails().size() + 1);
        return mongoOperations
                .find(q, User.class)
                .filter(user -> !getSystemGeneratedUserEmails().contains(user.getEmail()))
                .count()
                .map(count -> count == 0);*/
    }

    @Override
    public List<User> getAllByEmails(
            Set<String> emails,
            Optional<AclPermission> aclPermission,
            int limit,
            int skip,
            StringPath sortKey,
            Sort.Direction sortDirection) {
        Sort sortBy = Sort.by(sortDirection, fieldName(sortKey));
        Criteria emailCriteria = where("email").in(emails);
        return queryAll(List.of(emailCriteria), Optional.empty(), aclPermission, sortBy, limit, skip);
    }

    protected Set<String> getSystemGeneratedUserEmails() {
        Set<String> systemGeneratedEmails = new HashSet<>();
        systemGeneratedEmails.add(FieldName.ANONYMOUS_USER);
        return systemGeneratedEmails;
    }
}
