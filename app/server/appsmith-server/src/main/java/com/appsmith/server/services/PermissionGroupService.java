package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.services.ce.PermissionGroupServiceCE;
import reactor.core.publisher.Mono;

import java.util.List;

public interface PermissionGroupService extends PermissionGroupServiceCE {

    Mono<List<PermissionGroupInfoDTO>> getAll();

    Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles();

    Mono<PermissionGroup> findById(String id, AclPermission permission);

    Mono<PermissionGroup> archiveById(String id);
}
