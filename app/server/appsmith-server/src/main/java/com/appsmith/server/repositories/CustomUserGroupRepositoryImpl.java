package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.UserGroup;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomUserGroupRepositoryImpl extends BaseAppsmithRepositoryImpl<UserGroup> implements CustomUserGroupRepository {

    public CustomUserGroupRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<UserGroup> findAllByTenantId(String tenantId, AclPermission aclPermission) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.tenantId)).is(tenantId);
        return queryAll(List.of(criteria), aclPermission);
    }

    @Override
    public Flux<UserGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.tenantId)).is(tenantId);
        return queryAll(
                List.of(criteria),
                includeFields,
                null,
                null,
                NO_RECORD_LIMIT
        );
    }
}