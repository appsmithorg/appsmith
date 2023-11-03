package com.appsmith.server.packages.crud;

import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.packages.base.BasePackageServiceCECompatible;
import reactor.core.publisher.Mono;

public interface CrudPackageServiceCECompatible extends BasePackageServiceCECompatible {
    Mono<PackageDTO> createPackage(PackageDTO packageToBeCreated, String workspaceId);
}
