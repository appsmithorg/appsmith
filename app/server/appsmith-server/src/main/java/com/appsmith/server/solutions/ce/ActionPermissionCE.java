package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface ActionPermissionCE {
    Mono<AclPermission> getDeletePermission();

    AclPermission getExecutePermission();
}
