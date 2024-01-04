package com.appsmith.server.packages.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import com.appsmith.server.repositories.PackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Service
@RequiredArgsConstructor
public class PackagePermissionCheckerImpl implements PackagePermissionChecker {
    private final PackageRepository packageRepository;

    @Override
    public Mono<Package> findById(String packageId, AclPermission permission) {
        List<String> projectionFieldNames = List.of(
                fieldName(QPackage.package$.id),
                fieldName(QPackage.package$.packageUUID),
                fieldName(QPackage.package$.unpublishedPackage),
                fieldName(QPackage.package$.version),
                fieldName(QPackage.package$.policies),
                fieldName(QPackage.package$.workspaceId));
        return packageRepository.findById(packageId, projectionFieldNames, permission);
    }

    @Override
    public Flux<Package> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriterion =
                where(fieldName(QPackage.package$.workspaceId)).is(workspaceId);

        List<String> projectionFieldNames = List.of(
                fieldName(QPackage.package$.id),
                fieldName(QPackage.package$.packageUUID),
                completeFieldName(QPackage.package$.unpublishedPackage.name),
                fieldName(QPackage.package$.workspaceId));

        return packageRepository.queryAll(List.of(workspaceIdCriterion), projectionFieldNames, permission, null);
    }
}
