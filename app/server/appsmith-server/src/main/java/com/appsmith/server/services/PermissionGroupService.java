package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.ce_compatible.PermissionGroupServiceCECompatible;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PermissionGroupService extends PermissionGroupServiceCECompatible {
    Flux<PermissionGroup> findAllByAssignedToUsersIn(Set<String> userIds);

    Mono<Boolean> bulkUnassignUserFromPermissionGroupsWithoutPermission(User user, Set<String> permissionGroupIds);

    Flux<PermissionGroup> findAllByAssignedToUserId(String userId);

    Mono<Boolean> bulkAssignToUsersWithoutPermission(PermissionGroup pg, List<User> users);

    Flux<PermissionGroup> findAllByAssignedToUserIdsInWithoutPermission(Set<String> userIds);

    Flux<PermissionGroup> findAllByAssignedToUserIdWithoutPermission(String userId);

    Flux<PermissionGroup> getAllDefaultRolesForApplication(
            Application application, Optional<AclPermission> aclPermission);

    Mono<PermissionGroup> bulkUnassignFromUserGroupsWithoutPermission(
            PermissionGroup permissionGroup, Set<String> userGroupIds);

    Flux<String> getRoleNamesAssignedDirectlyOrIndirectlyToUserIds(Set<String> userIds);

    Flux<PermissionGroup> findAllByAssignedToGroupIds(
            Set<String> groupIds, Optional<List<String>> listIncludeFields, Optional<AclPermission> aclPermission);
}
