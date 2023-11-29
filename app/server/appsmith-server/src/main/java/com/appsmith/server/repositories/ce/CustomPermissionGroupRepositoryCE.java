package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission);

    Optional<UpdateResult> updateById(String id, Update updateObj);

    List<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission);

    List<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission);

    Optional<Void> evictPermissionGroupsUser(String email, String tenantId);

    Optional<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId);

    List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission);

    Set<String> getCurrentUserPermissionGroups();

    Set<String> getAllPermissionGroupsIdsForUser(User user);
}
