package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface DatasourcePermissionCE {
    Mono<AclPermission> getDeletePermission();

    AclPermission getExecutePermission();

    Mono<AclPermission> getActionCreatePermission();
}
