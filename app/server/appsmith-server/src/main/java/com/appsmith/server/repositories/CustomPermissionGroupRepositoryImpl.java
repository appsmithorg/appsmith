package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomPermissionGroupRepositoryImpl extends CustomPermissionGroupRepositoryCEImpl
        implements CustomPermissionGroupRepository {

    public CustomPermissionGroupRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
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
    public Flux<PermissionGroup> findAllByAssignedToUserGroupIdAndDefaultWorkspaceId(String userGroupId, String workspaceId,
                                                                                AclPermission permission) {
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToGroupIds)).in(userGroupId);
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).is(workspaceId);
        return queryAll(List.of(assignedToUserIdCriteria, defaultWorkspaceIdCriteria), permission);
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

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIds(Set<String> userIds, AclPermission permission) {
        Criteria criteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).in(userIds);
        return queryAll(
                List.of(criteria),
                null,
                permission,
                null,
                NO_RECORD_LIMIT);
    }

    @Override
    public Mono<Long> countAllReadablePermissionGroups() {
        return count(List.of(), AclPermission.READ_PERMISSION_GROUPS);
    }

    public Flux<PermissionGroup> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        Criteria criteria = where(fieldName(QPermissionGroup.permissionGroup.id)).in(ids);
        return queryAll(
                List.of(criteria),
                includeFields,
                null,
                null,
                NO_RECORD_LIMIT
        );
    }

    public Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public Mono<Long> countAllReadablePermissionGroupsForUser(User user) {
        return cacheableRepositoryHelper.getAllReadablePermissionGroupsForUser(user);
    }

    @Override
    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return Mono.when(super.evictAllPermissionGroupCachesForUser(email, tenantId),
                cacheableRepositoryHelper.evictGetAllReadablePermissionGroupsForUser(email, tenantId)).then();
    }
}
