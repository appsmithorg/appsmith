package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    @Override
    public List<PermissionGroup> findByAssignedToUserIdsIn(String userId, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.jsonIn(userId, PermissionGroup.Fields.assignedToUserIds))
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId,
            String workspaceId,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>jsonIn(
                        userId, PermissionGroup.Fields.assignedToUserIds)
                .equal(PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());

        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    @Transactional
    @Modifying
    public int updateById(String id, BridgeUpdate updateObj, EntityManager entityManager) {
        if (id == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }
        return queryBuilder().byId(id).entityManager(entityManager).updateFirst(updateObj);
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>equal(
                        PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(
            Set<String> workspaceIds, AclPermission permission, User currentUser, EntityManager entityManager) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>in(
                        PermissionGroup.Fields.defaultDomainId, workspaceIds)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public Optional<Void> evictPermissionGroupsUser(String email, String tenantId, EntityManager entityManager) {
        return cacheableRepositoryHelper
                .evictPermissionGroupsUser(email, tenantId)
                .blockOptional();
    }

    @Override
    public Optional<Void> evictAllPermissionGroupCachesForUser(
            String email, String tenantId, EntityManager entityManager) {
        return this.evictPermissionGroupsUser(email, tenantId, entityManager);
    }

    @Override
    public Set<String> getPermissionGroupsForUser(User user, EntityManager entityManager) {
        return super.getPermissionGroupsForUser(user, entityManager);
    }

    @Override
    public Set<String> getAllPermissionGroupsIdsForUser(User user, EntityManager entityManager) {
        return super.getAllPermissionGroupsForUser(user, entityManager);
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds,
            Optional<List<String>> includeFields,
            Optional<AclPermission> permission,
            User currentUser,
            EntityManager entityManager) {
        BridgeQuery<PermissionGroup> assignedToUserIdCriteria =
                Bridge.in(PermissionGroup.Fields.assignedToUserIds, userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null), currentUser)
                .entityManager(entityManager)
                .all();
    }
}
