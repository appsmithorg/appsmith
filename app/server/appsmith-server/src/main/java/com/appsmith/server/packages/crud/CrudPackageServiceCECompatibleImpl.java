package com.appsmith.server.packages.crud;

import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.packages.base.BasePackageServiceImpl;
import com.appsmith.server.repositories.PackageRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class CrudPackageServiceCECompatibleImpl extends BasePackageServiceImpl
        implements CrudPackageServiceCECompatible {
    public CrudPackageServiceCECompatibleImpl(PackageRepository packageRepository) {
        super(packageRepository);
    }

    @Override
    public Mono<PackageDTO> createPackage(PackageDTO packageToBeCreated, String workspaceId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
