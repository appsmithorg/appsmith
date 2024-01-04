package com.appsmith.server.packages.base;

import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.repositories.PackageRepository;
import reactor.core.publisher.Mono;

public abstract class BasePackageServiceImpl extends BasePackageServiceCECompatibleImpl implements BasePackageService {

    private final PackageRepository repository;

    public BasePackageServiceImpl(PackageRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<PackageDTO> setTransientFieldsFromPackageToPackageDTO(Package aPackage, PackageDTO packageDTO) {
        packageDTO.setWorkspaceId(aPackage.getWorkspaceId());
        packageDTO.setId(aPackage.getId());
        packageDTO.setPackageUUID(aPackage.getPackageUUID());
        packageDTO.setUserPermissions(aPackage.getUserPermissions());
        packageDTO.setModifiedAt(aPackage.getLastUpdateTime());
        packageDTO.setModifiedBy(aPackage.getModifiedBy());
        packageDTO.setLastPublishedAt(aPackage.getLastPublishedTime());
        packageDTO.setPolicies(aPackage.getPolicies());
        packageDTO.setOriginPackageId(aPackage.getSourcePackageId());
        packageDTO.setVersion(aPackage.getVersion());

        return Mono.just(packageDTO);
    }
}
