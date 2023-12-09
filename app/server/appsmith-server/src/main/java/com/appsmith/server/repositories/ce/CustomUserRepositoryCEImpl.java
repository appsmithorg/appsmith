package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
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
}
