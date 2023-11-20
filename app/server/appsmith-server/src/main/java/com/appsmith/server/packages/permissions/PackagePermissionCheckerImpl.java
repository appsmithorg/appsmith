package com.appsmith.server.packages.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import com.appsmith.server.repositories.PackageRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
public class PackagePermissionCheckerImpl implements PackagePermissionChecker {
    private final PackageRepository packageRepository;

    public PackagePermissionCheckerImpl(PackageRepository packageRepository) {
        this.packageRepository = packageRepository;
    }

    @Override
    public Mono<Package> findById(String packageId, AclPermission permission) {
        List<String> projectionFieldNames = List.of(
                fieldName(QPackage.package$.id),
                fieldName(QPackage.package$.packageUUID),
                fieldName(QPackage.package$.policies),
                fieldName(QPackage.package$.workspaceId));
        return packageRepository.findById(packageId, projectionFieldNames, permission);
    }
}
