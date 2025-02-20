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
    public List<PermissionGroup> findByAssignedToUserIdsIn(String userId) {
        return queryBuilder()
                .criteria(Bridge.jsonIn(userId, PermissionGroup.Fields.assignedToUserIds))
                .all();
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission, User currentUser) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>jsonIn(
                        userId, PermissionGroup.Fields.assignedToUserIds)
                .equal(PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());

        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    @Transactional
    @Modifying
    public int updateById(String id, BridgeUpdate updateObj) {
        if (id == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }
        return queryBuilder().byId(id).updateFirst(updateObj);
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>equal(
                        PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(
            Set<String> workspaceIds, AclPermission permission, User currentUser) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>in(
                        PermissionGroup.Fields.defaultDomainId, workspaceIds)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public Optional<Void> evictPermissionGroupsUser(String email, String organizationId) {
        return cacheableRepositoryHelper
                .evictPermissionGroupsUser(email, organizationId)
                .blockOptional();
    }

    @Override
    public Optional<Void> evictAllPermissionGroupCachesForUser(String email, String organizationId) {
        return this.evictPermissionGroupsUser(email, organizationId);
    }

    @Override
    public Set<String> getPermissionGroupsForUser(User user) {
        return super.getPermissionGroupsForUser(user);
    }

    @Override
    public Set<String> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds,
            Optional<List<String>> includeFields,
            Optional<AclPermission> permission,
            User currentUser) {
        BridgeQuery<PermissionGroup> assignedToUserIdCriteria =
                Bridge.in(PermissionGroup.Fields.assignedToUserIds, userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null), currentUser)
                .all();
    }
}
