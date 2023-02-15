package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomPermissionGroupRepository extends CustomPermissionGroupRepositoryCE {

    Flux<PermissionGroup> findAll(AclPermission aclPermission);

    Flux<PermissionGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields);

    Flux<PermissionGroup> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);

    Flux<PermissionGroup> findAllById(Set<String> ids, AclPermission permission);

    Flux<PermissionGroup> findAllByAssignedToUserGroupIdAndDefaultWorkspaceId(String userGroupId, String workspaceId, AclPermission permission);

    Flux<PermissionGroup> findAllByAssignedToUserIds(Set<String> userIds, AclPermission aclPermission);

    Mono<Long> countAllReadablePermissionGroups();
    Mono<Long> countAllReadablePermissionGroupsForUser(User user);
    Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user);

}
