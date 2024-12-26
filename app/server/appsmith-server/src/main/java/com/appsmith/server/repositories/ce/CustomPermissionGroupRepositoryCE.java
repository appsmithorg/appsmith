package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    List<PermissionGroup> findByAssignedToUserIdsIn(String userId, EntityManager entityManager);

    List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);

    int updateById(String id, BridgeUpdate updateObj, EntityManager entityManager);

    List<PermissionGroup> findByDefaultWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<PermissionGroup> findByDefaultWorkspaceIds(
            Set<String> workspaceIds, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Void> evictPermissionGroupsUser(String email, String tenantId, EntityManager entityManager);

    Optional<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId, EntityManager entityManager);

    List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds,
            Optional<List<String>> includeFields,
            Optional<AclPermission> permission,
            User currentUser,
            EntityManager entityManager);

    Set<String> getPermissionGroupsForUser(User user, EntityManager entityManager);

    Set<String> getAllPermissionGroupsIdsForUser(User user, EntityManager entityManager);
}
