package com.appsmith.server.packages.services.crud;

import com.appsmith.external.models.PackageDTO;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.packages.services.base.BasePackageService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudPackageService extends BasePackageService, CrudPackageServiceCECompatible {
    Mono<Package> createPackage(Package packageToBeCreated, String workspaceId);

    Mono<List<PackageDTO>> getAllPackages();

    Mono<PackageDTO> generatePackageByViewMode(Package aPackage, ResourceModes resourceMode);

    Mono<PackageDetailsDTO> getPackageDetails(String packageId);

    Mono<Package> updatePackage(Package packageResource, String packageId);
}
