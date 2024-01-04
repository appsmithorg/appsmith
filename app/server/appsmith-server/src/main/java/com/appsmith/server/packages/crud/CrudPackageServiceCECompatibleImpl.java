package com.appsmith.server.packages.crud;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.packages.base.BasePackageServiceImpl;
import com.appsmith.server.repositories.PackageRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class CrudPackageServiceCECompatibleImpl extends BasePackageServiceImpl
        implements CrudPackageServiceCECompatible {
    public CrudPackageServiceCECompatibleImpl(PackageRepository packageRepository) {
        super(packageRepository);
    }

    @Override
    public Mono<Package> findByBranchNameAndDefaultPackageId(
            String branchName,
            String defaultPackageId,
            List<String> projectionFieldNames,
            AclPermission aclPermission) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PackageDTO> createPackage(PackageDTO packageToBeCreated, String workspaceId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UpdateResult> update(String contextId, Map<String, Object> fieldNameValueMap, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<Package> getAllPublishedPackagesByUniqueRef(String workspaceId, List<ExportableModule> packageList) {
        return Flux.empty();
    }

    @Override
    public Mono<PackageDTO> getConsumablePackageBySourcePackageIdAndVersion(String sourcePackageId, String version) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
