package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    public CustomPermissionGroupRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        Criteria assignedToUserIdCriteria =
                where(PermissionGroup.Fields.assignedToUserIds).in(userId);
        Criteria defaultWorkspaceIdCriteria =
                where(PermissionGroup.Fields.defaultDomainId).is(workspaceId);
        Criteria defaultDomainTypeCriteria =
                where(PermissionGroup.Fields.defaultDomainType).is(Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(assignedToUserIdCriteria, defaultWorkspaceIdCriteria, defaultDomainTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Integer> updateById(String id, Update updateObj) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return queryBuilder().byId(id).updateFirst(updateObj);
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria defaultWorkspaceIdCriteria =
                where(PermissionGroup.Fields.defaultDomainId).is(workspaceId);
        Criteria defaultDomainTypeCriteria =
                where(PermissionGroup.Fields.defaultDomainType).is(Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria defaultWorkspaceIdCriteria =
                where(PermissionGroup.Fields.defaultDomainId).in(workspaceIds);
        Criteria defaultDomainTypeCriteria =
                where(PermissionGroup.Fields.defaultDomainType).is(Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return cacheableRepositoryHelper.evictPermissionGroupsUser(email, tenantId);
    }

    @Override
    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return this.evictPermissionGroupsUser(email, tenantId);
    }

    @Override
    public Mono<Set<String>> getCurrentUserPermissionGroups() {
        return super.getCurrentUserPermissionGroups();
    }

    @Override
    public Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        Criteria assignedToUserIdCriteria =
                where(PermissionGroup.Fields.assignedToUserIds).in(userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .all();
    }
}
