package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
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

    Mono<PermissionGroup> bulkUnassignFromUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles();

    Mono<PermissionGroup> findById(String id, AclPermission permission);

    Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds);

    Mono<RoleViewDTO> findConfigurableRoleById(String id);

    Mono<Boolean> changeRoleAssociations(UpdateRoleAssociationDTO updateRoleAssociationDTO);

    Mono<PermissionGroupInfoDTO> updatePermissionGroup(String id, PermissionGroup permissionGroup);

    Mono<RoleViewDTO> createCustomPermissionGroup(PermissionGroup permissionGroup);

    Mono<Boolean> bulkUnassignUserFromPermissionGroupsWithoutPermission(String userId, Set<String> permissionGroupIds);
}
