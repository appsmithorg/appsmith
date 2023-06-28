package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ce.CustomUserRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomUserRepositoryImpl extends CustomUserRepositoryCEImpl implements CustomUserRepository {

    public CustomUserRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<String> getAllUserEmail(String defaultTenantId) {
        Query query = new Query();
        query.addCriteria(where(fieldName(QUser.user.tenantId)).is(defaultTenantId));
        query.fields().include(fieldName(QUser.user.email));
        return mongoOperations.find(query, User.class).map(User::getEmail);
    }

    @Override
    public Flux<User> getAllUserObjectsWithEmail(String defaultTenantId, Optional<AclPermission> aclPermission) {
        Criteria tenantIdCriteria = where(fieldName(QUser.user.tenantId)).is(defaultTenantId);
        List<String> includedFields = List.of(fieldName(QUser.user.email));
        return queryAll(
                List.of(tenantIdCriteria),
                Optional.of(includedFields),
                aclPermission,
                Optional.empty(),
                NO_RECORD_LIMIT
        );
    }
}
