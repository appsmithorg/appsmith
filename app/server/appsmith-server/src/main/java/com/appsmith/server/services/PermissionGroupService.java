package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.services.ce.PermissionGroupServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface PermissionGroupService extends PermissionGroupServiceCE {

    Mono<List<PermissionGroupInfoDTO>> getAll();

    Mono<PermissionGroup> archiveById(String id);

    Mono<PermissionGroup> bulkUnassignFromUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups);

    Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles();

    Mono<PermissionGroup> findById(String id, AclPermission permission);

    Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds);
}
