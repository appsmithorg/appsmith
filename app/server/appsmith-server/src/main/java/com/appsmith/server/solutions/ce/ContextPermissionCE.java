package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface ContextPermissionCE {

    Mono<AclPermission> getDeletePermission();

    AclPermission getEditPermission();

    default Mono<AclPermission> getActionCreatePermission() {
        return Mono.empty();
    }
}
