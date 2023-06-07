package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

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

    @Override
    public Mono<UserGroup> findByIdAndTenantIdithoutPermission(String id, String tenantId) {
        Criteria idCriteria = where(fieldName(QUserGroup.userGroup.id)).is(id);
        Criteria tenantIdCriteria = where(fieldName(QUserGroup.userGroup.tenantId)).is(tenantId);

        Criteria andCriteria = new Criteria();
        andCriteria.andOperator(idCriteria, tenantIdCriteria, notDeleted());

        Query query = new Query();
        query.addCriteria(andCriteria);
        return mongoOperations.findOne(query, UserGroup.class);
    }

    @Override
    public Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission aclPermission) {
        Criteria criteria = where(fieldName(QUserGroup.userGroup.id)).in(ids);
        return queryAll(List.of(criteria), aclPermission);
    }

    @Override
    public Mono<UpdateResult> updateById(String id, Update updateObj) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        Query query = new Query(Criteria.where("id").is(id));
        return mongoOperations.updateFirst(query, updateObj, this.genericDomain);
    }

    @Override
    public Mono<Long> countAllReadableUserGroups() {
        return count(List.of(), AclPermission.READ_USER_GROUPS);
    }

    @Override
    public Flux<UserGroup> getAllByUsersIn(Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        Criteria criteriaUserIdsIn = where(fieldName(QUserGroup.userGroup.users)).in(userIds);
        return queryAll(
                List.of(criteriaUserIdsIn),
                includeFields,
                permission,
                Optional.empty(),
                NO_RECORD_LIMIT
        );
    }
}