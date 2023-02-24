package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.services.ce.PermissionGroupServiceCE;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface PermissionGroupService extends PermissionGroupServiceCE {

    Mono<List<PermissionGroupInfoDTO>> getAll();

    Flux<PermissionGroup> findAllByAssignedToUsersIn(Set<String> userIds);

    Mono<PermissionGroup> archiveById(String id);

    Mono<PermissionGroup> bulkUnassignFromUserGroupsWithoutPermission(PermissionGroup permissionGroup, Set<String> userGroupIds);

    Mono<PermissionGroup> bulkUnassignFromUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles();

    Mono<PermissionGroup> findById(String id, AclPermission permission);

    Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds);

    Flux<PermissionGroup> getAllByAssignedToUserGroupAndDefaultWorkspace(UserGroup userGroup, Workspace defaultWorkspace, AclPermission aclPermission);

    Mono<RoleViewDTO> findConfigurableRoleById(String id);

    Mono<PermissionGroupInfoDTO> updatePermissionGroup(String id, PermissionGroup permissionGroup);

    Mono<RoleViewDTO> createCustomPermissionGroup(PermissionGroup permissionGroup);

    Mono<Boolean> bulkUnassignUserFromPermissionGroupsWithoutPermission(User user, Set<String> permissionGroupIds);

    Mono<PermissionGroup> unassignFromUserGroup(PermissionGroup permissionGroup, UserGroup userGroup);

    Mono<PermissionGroup> assignToUserGroup(PermissionGroup permissionGroup, UserGroup userGroup);

    Mono<PermissionGroup> bulkAssignToUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Flux<PermissionGroup> findAllByAssignedToUserId(String userId);

    Flux<PermissionGroup> findAllByAssignedToGroupId(String userGroupId);

    Mono<Boolean> bulkAssignToUsersWithoutPermission(PermissionGroup pg, List<User> users);

    Mono<Set<String>> getSessionUserPermissionGroupIds();
    Mono<Set<String>> getAllDirectlyAndIndirectlyAssignedUserIds(PermissionGroup permissionGroup);

}
