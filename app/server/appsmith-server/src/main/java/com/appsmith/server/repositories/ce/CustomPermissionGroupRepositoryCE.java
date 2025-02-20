package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    List<PermissionGroup> findByAssignedToUserIdsIn(String userId);

    List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission, User currentUser);

    int updateById(String id, BridgeUpdate updateObj);

    List<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission, User currentUser);

    Optional<Void> evictPermissionGroupsUser(String email, String organizationId);

    List<PermissionGroup> findByDefaultWorkspaceIds(
            Set<String> workspaceIds, AclPermission permission, User currentUser);

    Optional<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId);

    List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds,
            Optional<List<String>> includeFields,
            Optional<AclPermission> permission,
            User currentUser);

    Set<String> getPermissionGroupsForUser(User user);

    Set<String> getAllPermissionGroupsIdsForUser(User user);
}
