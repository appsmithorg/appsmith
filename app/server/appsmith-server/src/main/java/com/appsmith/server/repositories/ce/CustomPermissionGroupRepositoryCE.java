package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.AppsmithRepository;

import reactor.core.publisher.Flux;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(String userId, String workspaceId, AclPermission permission);

    Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission);

}
