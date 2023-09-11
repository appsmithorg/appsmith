package com.appsmith.server.packages.services.crud;

import com.appsmith.server.packages.services.base.BasePackageServiceImpl;
import com.appsmith.server.repositories.PackageRepository;
import org.springframework.stereotype.Service;

@Service
public class CrudPackageServiceImpl extends BasePackageServiceImpl implements CrudPackageService {

    private final PackageRepository packageRepository;

    public CrudPackageServiceImpl(PackageRepository packageRepository) {
        super(packageRepository);
        this.packageRepository = packageRepository;
    }
}
