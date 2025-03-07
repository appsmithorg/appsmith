package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface WorkspacePermissionCE {
    Mono<AclPermission> getDeletePermission();

    Mono<AclPermission> getApplicationCreatePermission();

    Mono<AclPermission> getDatasourceCreatePermission();
}
