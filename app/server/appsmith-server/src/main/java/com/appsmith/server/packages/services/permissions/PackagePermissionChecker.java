package com.appsmith.server.packages.services.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import reactor.core.publisher.Mono;

public interface PackagePermissionChecker {
    Mono<Package> findById(String packageId, AclPermission permission);
}
