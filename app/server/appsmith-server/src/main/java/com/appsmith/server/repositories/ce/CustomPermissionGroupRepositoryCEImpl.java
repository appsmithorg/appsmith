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
            String userId, String workspaceId, AclPermission permission) {
        /*
        TODO (Shri/Abhijeet): Find better alternative for the queries based on jsonb columns
        Seems to be failing with in operator applied over jsonb column where query generated ends up with failing to
        detect the operator

        > where (p1_0.deleted_at IS NULL) and p1_0."assigned_to_user_ids" in(?) and p1_0."default_domain_id"=domain_id
        and p1_0."default_domain_type"='Workspace' and p1_0."deleted_at" is null ...

        Error:
        Caused by: org.postgresql.util.PSQLException: ERROR: operator does not exist: jsonb = character varying
        Hint: No operator matches the given name and argument types. You might need to add explicit type casts.

        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>in(
                        PermissionGroup.Fields.assignedToUserIds, List.of(userId))
                .equal(PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());

        return queryBuilder().criteria(query).permission(permission).all();

         */
        return queryBuilder()
                .criteria((root, cq, cb) -> cb.and(
                        cb.isTrue(cb.function(
                                "jsonb_path_exists",
                                Boolean.class,
                                root.get(PermissionGroup.Fields.assignedToUserIds),
                                cb.literal("$[*] ? (@ == \"" + userId + "\")"))),
                        cb.equal(root.get(PermissionGroup.Fields.defaultDomainId), workspaceId),
                        cb.equal(root.get(PermissionGroup.Fields.defaultDomainType), Workspace.class.getSimpleName())))
                .permission(permission)
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
    public List<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>equal(
                        PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder().criteria(query).permission(permission).all();
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>in(
                        PermissionGroup.Fields.defaultDomainId, workspaceIds)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder().criteria(query).permission(permission).all();
    }

    @Override
    public Optional<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return cacheableRepositoryHelper
                .evictPermissionGroupsUser(email, tenantId)
                .blockOptional();
    }

    @Override
    public Optional<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return this.evictPermissionGroupsUser(email, tenantId);
    }

    @Override
    public Set<String> getCurrentUserPermissionGroups() {
        return super.getCurrentUserPermissionGroups();
    }

    @Override
    public Set<String> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        BridgeQuery<PermissionGroup> assignedToUserIdCriteria =
                Bridge.in(PermissionGroup.Fields.assignedToUserIds, userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .all();
    }
}
