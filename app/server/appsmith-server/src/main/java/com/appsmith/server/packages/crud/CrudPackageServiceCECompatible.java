package com.appsmith.server.packages.crud;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.packages.base.BasePackageServiceCECompatible;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface CrudPackageServiceCECompatible extends BasePackageServiceCECompatible {
    Mono<Package> findByBranchNameAndDefaultPackageId(
            String branchName, String defaultPackageId, List<String> projectionFieldNames, AclPermission aclPermission);

    Mono<PackageDTO> createPackage(PackageDTO packageToBeCreated, String workspaceId);

    Mono<UpdateResult> update(String contextId, Map<String, Object> fieldNameValueMap, String branchName);

    Flux<Package> getAllPublishedPackagesByUniqueRef(String workspaceId, List<ExportableModule> packageList);

    Mono<PackageDTO> getConsumablePackageBySourcePackageIdAndVersion(String sourcePackageId, String version);
}
