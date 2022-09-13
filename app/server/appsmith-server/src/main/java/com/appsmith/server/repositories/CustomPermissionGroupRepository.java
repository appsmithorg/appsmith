package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE;
import reactor.core.publisher.Flux;

public interface CustomPermissionGroupRepository extends CustomPermissionGroupRepositoryCE {

    Flux<PermissionGroup> findAll(AclPermission aclPermission);
}
