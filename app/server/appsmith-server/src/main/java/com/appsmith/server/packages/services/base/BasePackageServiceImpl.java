package com.appsmith.server.packages.services.base;

import com.appsmith.server.repositories.PackageRepository;

public abstract class BasePackageServiceImpl extends BasePackageServiceCECompatibleImpl implements BasePackageService {

    private final PackageRepository packageRepository;

    public BasePackageServiceImpl(PackageRepository packageRepository) {
        this.packageRepository = packageRepository;
    }
}
