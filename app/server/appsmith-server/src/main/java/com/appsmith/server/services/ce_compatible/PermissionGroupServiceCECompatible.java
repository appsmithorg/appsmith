package com.appsmith.server.services.ce_compatible;

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

public interface PermissionGroupServiceCECompatible extends PermissionGroupServiceCE {
    Mono<List<PermissionGroupInfoDTO>> getAll();

    Mono<PermissionGroup> archiveById(String id);

    Mono<PermissionGroup> bulkUnassignFromUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles();

    Mono<PermissionGroup> findById(String id, AclPermission permission);

    Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds);

    Flux<PermissionGroup> getAllByAssignedToUserGroupAndDefaultWorkspace(
            UserGroup userGroup, Workspace defaultWorkspace, AclPermission aclPermission);

    Mono<RoleViewDTO> findConfigurableRoleById(String id);

    Mono<PermissionGroupInfoDTO> updatePermissionGroup(String id, PermissionGroup permissionGroup);

    Mono<RoleViewDTO> createCustomPermissionGroup(PermissionGroup permissionGroup);

    Mono<PermissionGroup> unassignFromUserGroup(PermissionGroup permissionGroup, UserGroup userGroup);

    Mono<PermissionGroup> assignToUserGroup(PermissionGroup permissionGroup, UserGroup userGroup);

    Mono<PermissionGroup> bulkAssignToUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Flux<PermissionGroup> findAllByAssignedToGroupId(String userGroupId);

    Mono<Set<String>> getAllDirectlyAndIndirectlyAssignedUserIds(PermissionGroup permissionGroup);

    Mono<PermissionGroup> bulkAssignToUsersAndGroups(PermissionGroup role, List<User> users, List<UserGroup> groups);

    Mono<PermissionGroup> assignToUserGroupAndSendEvent(PermissionGroup permissionGroup, UserGroup userGroup);

    Mono<PermissionGroup> bulkAssignToUserGroupsAndSendEvent(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Mono<PermissionGroup> unAssignFromUserGroupAndSendEvent(PermissionGroup permissionGroup, UserGroup userGroup);

    Mono<PermissionGroup> bulkUnAssignFromUserGroupsAndSendEvent(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Mono<Boolean> bulkUnAssignUsersAndUserGroupsFromPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles);

    Mono<Boolean> bulkAssignUsersAndUserGroupsToPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles);

    Flux<PermissionGroup> findAllByAssignedToGroupIdsInWithoutPermission(Set<String> groupIds);

    Flux<PermissionGroup> findAllByAssignedToGroupIdWithoutPermission(String groupId);
}
