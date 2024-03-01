package com.appsmith.server.packages.crud;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.packages.base.BasePackageService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CrudPackageService extends BasePackageService, CrudPackageServiceCECompatible {

    Mono<Package> createPackageWithPreciseName(PackageDTO packageToBeCreated, String workspaceId);

    Mono<List<PackageDTO>> getAllEditablePackages();

    Mono<ConsumablePackagesAndModulesDTO> getAllPackagesForConsumer(String workspaceId);

    Mono<PackageDTO> generatePackageByViewMode(Package aPackage, ResourceModes resourceMode);

    Mono<PackageDetailsDTO> getPackageDetails(String packageId);

    Mono<PackageDTO> updatePackage(PackageDTO packageResource, String packageId);

    Mono<PackageDTO> deletePackage(String packageId);

    Flux<Package> getUniquePublishedReference(Set<String> packageIds);

    Mono<PackageDTO> getLatestConsumablePackageByOriginPackageId(String originPackageId);

    Mono<Package> findById(String packageId, AclPermission permission);
}
