package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ExportableModule;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CustomPackageRepository extends AppsmithRepository<Package> {
    Flux<Package> findAllEditablePackages(AclPermission permission);

    Flux<Package> findAllConsumablePackages(String workspaceId, AclPermission permission);

    Mono<Package> findByBranchNameAndDefaultPackageId(
            String defaultPackageId, List<String> projectionFieldNames, String branchName, AclPermission aclPermission);

    Mono<Integer> updateFieldByDefaultIdAndBranchName(
            String contextId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission aclPermission);

    Flux<Package> findAllByIds(List<String> packageIds, List<String> projectionFields);

    Flux<Package> findAllPublishedByUniqueReference(
            String workspaceId, List<ExportableModule> exportableModuleList, Optional<AclPermission> aclPermission);

    Mono<Package> findPackageByOriginPackageIdAndVersion(
            String originPackageId, String version, Optional<AclPermission> permission);

    Flux<Package> findAllPackagesByWorkspaceId(
            String workspaceId, List<String> projectionFields, Optional<AclPermission> permissionOptional);

    Mono<Void> unsetLatestPackageByOriginId(String originPackageId, AclPermission permission);

    Mono<Package> findLatestPackageByOriginPackageId(String originPackageId, Optional<AclPermission> permission);

    Flux<Package> findAllByPackageUUID(String packageUUID, Optional<AclPermission> permission);
}
