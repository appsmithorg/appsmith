package com.appsmith.server.packages.services.crud;

import com.appsmith.server.domains.Package;
import com.appsmith.server.packages.services.base.BasePackageServiceCECompatible;
import reactor.core.publisher.Mono;

public interface CrudPackageServiceCECompatible extends BasePackageServiceCECompatible {
    Mono<Package> createPackage(Package packageToBeCreated, String workspaceId);
}
