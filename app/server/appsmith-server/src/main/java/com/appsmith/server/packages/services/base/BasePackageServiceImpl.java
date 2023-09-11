package com.appsmith.server.packages.services.base;

import com.appsmith.server.repositories.PackageRepository;
import org.springframework.stereotype.Service;

@Service
public abstract class BasePackageServiceImpl implements BasePackageService {

    private final PackageRepository packageRepository;

    public BasePackageServiceImpl(PackageRepository packageRepository) {
        this.packageRepository = packageRepository;
    }
}
