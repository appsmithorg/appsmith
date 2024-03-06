package com.appsmith.server.packages.metadata;

import com.appsmith.server.domains.Package;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PackageMetadataServiceImpl implements PackageMetadataService {
    private final PackageRepository packageRepository;
    private final SessionUserService sessionUserService;
    private final PackagePermission packagePermission;
    /**
     * Sets the updatedAt and modifiedBy fields of the Package
     *
     * @param packageId Package ID
     * @return Package Mono of updated Package
     */
    @Override
    public Mono<Package> saveLastEditInformation(String packageId) {
        return sessionUserService.getCurrentUser().flatMap(currentUser -> {
            Package aPackage = new Package();

            aPackage.setLastEditedAt(Instant.now());
            aPackage.setModifiedBy(currentUser.getUsername());
            /*
             We're not setting updatedAt and modifiedBy fields to the package DTO because these fields will be set
             by the updateById method of the BaseAppsmithRepositoryImpl
            */
            return packageRepository.updateById(packageId, aPackage, packagePermission.getEditPermission());
        });
    }
}
