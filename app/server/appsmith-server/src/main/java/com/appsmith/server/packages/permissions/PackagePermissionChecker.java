package com.appsmith.server.packages.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PackagePermissionChecker {
    Mono<Package> findById(String packageId, AclPermission permission);

    Flux<Package> findAllByWorkspaceId(String workspaceId, AclPermission permission);
}
