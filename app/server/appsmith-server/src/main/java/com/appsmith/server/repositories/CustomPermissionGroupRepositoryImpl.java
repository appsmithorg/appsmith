package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomPermissionGroupRepositoryImpl extends CustomPermissionGroupRepositoryCEImpl
        implements CustomPermissionGroupRepository {

    public CustomPermissionGroupRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter,
                                               CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<PermissionGroup> findAll(AclPermission aclPermission) {
        return super.queryAll(List.of(), aclPermission);
    }

    @Override
    public Flux<PermissionGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields) {
        Criteria criteria = where(fieldName(QPermissionGroup.permissionGroup.tenantId)).is(tenantId);
        return queryAll(
                List.of(criteria),
                includeFields,
                null,
                null,
                NO_RECORD_LIMIT
        );
    }

    @Override
    public Flux<PermissionGroup> findAllById(Set<String> ids, AclPermission permission) {
        Criteria criteria = where(fieldName(QPermissionGroup.permissionGroup.id)).in(ids);
        return queryAll(
                List.of(criteria),
                null,
                permission,
                null,
                NO_RECORD_LIMIT
        );
    }
}
