package com.appsmith.server.packages.jslibs;

import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;

@RequiredArgsConstructor
@Service
public class PackageJsLibServiceImpl extends PackageJsLibServiceCECompatibleImpl
        implements ContextBasedJsLibService<Package> {

    private final CrudPackageService packageService;
    private final PackagePermission packagePermission;

    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllVisibleJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode) {
        return packageService
                .findByBranchNameAndDefaultPackageId(
                        branchName,
                        contextId,
                        List.of(
                                isViewMode
                                        ? completeFieldName(QPackage.package$.publishedPackage.customJSLibs)
                                        : completeFieldName(QPackage.package$.unpublishedPackage.customJSLibs)),
                        packagePermission.getReadPermission())
                .map(aPackage -> {
                    PackageDTO packageDTO;
                    if (isViewMode) {
                        packageDTO = aPackage.getPublishedPackage();
                    } else {
                        packageDTO = aPackage.getUnpublishedPackage();
                    }
                    return packageDTO == null ? new HashSet<>() : packageDTO.getCustomJSLibs();
                });
    }

    @Override
    public Mono<UpdateResult> updateJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> updatedJSLibDTOSet) {
        Map<String, Object> fieldNameValueMap =
                Map.of(completeFieldName(QPackage.package$.unpublishedPackage.customJSLibs), updatedJSLibDTOSet);
        return packageService.update(contextId, fieldNameValueMap, branchName);
    }

    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllHiddenJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode) {
        return packageService
                .findByBranchNameAndDefaultPackageId(
                        branchName,
                        contextId,
                        List.of(
                                isViewMode
                                        ? completeFieldName(QPackage.package$.publishedPackage.hiddenJSLibs)
                                        : completeFieldName(QPackage.package$.unpublishedPackage.hiddenJSLibs)),
                        packagePermission.getReadPermission())
                .map(aPackage -> {
                    PackageDTO packageDTO;
                    if (isViewMode) {
                        packageDTO = aPackage.getPublishedPackage();
                    } else {
                        packageDTO = aPackage.getUnpublishedPackage();
                    }
                    return packageDTO == null || packageDTO.getHiddenJSLibs() == null
                            ? new HashSet<>()
                            : packageDTO.getHiddenJSLibs();
                });
    }

    @Override
    public Mono<UpdateResult> updateHiddenJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> updatedJSLibDTOSet) {
        Map<String, Object> fieldNameValueMap =
                Map.of(completeFieldName(QPackage.package$.unpublishedPackage.hiddenJSLibs), updatedJSLibDTOSet);
        return packageService.update(contextId, fieldNameValueMap, branchName);
    }
}
