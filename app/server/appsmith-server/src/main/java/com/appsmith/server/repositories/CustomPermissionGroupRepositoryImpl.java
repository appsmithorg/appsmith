package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
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
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).is(workspaceId);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(Workspace.class.getSimpleName());
        return queryAll(List.of(assignedToUserIdCriteria, defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);
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

    @Override
    public Flux<PermissionGroup> findByDefaultApplicationId(String applicationId, Optional<AclPermission> permission) {
        return findByDefaultApplicationIds(Set.of(applicationId), permission);
    }

    @Override
    public Flux<PermissionGroup> findByDefaultApplicationIds(Set<String> applicationIds, Optional<AclPermission> permission) {
        Criteria defaultApplicationIdsCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).in(applicationIds);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(Application.class.getSimpleName());
        return queryAll(List.of(defaultApplicationIdsCriteria, defaultDomainTypeCriteria), permission);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultDomainIdAndDefaultDomainType(String userId,
                                                                                                 String defaultDomainId,
                                                                                                 String defaultDomainType,
                                                                                                 Optional<AclPermission> aclPermission) {
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).in(userId);
        Criteria defaultApplicationIdsCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).is(defaultDomainId);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(defaultDomainType);
        return queryAll(List.of(assignedToUserIdCriteria, defaultApplicationIdsCriteria, defaultDomainTypeCriteria), aclPermission);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdAndDefaultDomainIdAndDefaultDomainType(String groupId,
                                                                                                  String defaultDomainId,
                                                                                                  String defaultDomainType,
                                                                                                  Optional<AclPermission> aclPermission) {
        Criteria assignedToGroupIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToGroupIds)).in(groupId);
        Criteria defaultApplicationIdsCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).is(defaultDomainId);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(defaultDomainType);
        return queryAll(List.of(assignedToGroupIdCriteria, defaultApplicationIdsCriteria, defaultDomainTypeCriteria), aclPermission);
    }
}
