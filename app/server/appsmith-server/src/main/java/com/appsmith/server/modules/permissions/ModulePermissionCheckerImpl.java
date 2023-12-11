package com.appsmith.server.modules.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.QModule;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import com.appsmith.server.repositories.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Optional;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
@RequiredArgsConstructor
public class ModulePermissionCheckerImpl implements ModulePermissionChecker {
    private final ModuleRepository repository;
    private final ModulePermission modulePermission;
    private final PackagePermissionChecker packagePermissionChecker;
    private final PackagePermission packagePermission;

    @Override
    public Mono<Module> findById(String moduleId, AclPermission permission) {
        List<String> projectionFieldNames = List.of(
                fieldName(QModule.module.id),
                fieldName(QModule.module.packageUUID),
                fieldName(QModule.module.policies),
                fieldName(QModule.module.moduleUUID));
        return repository.findById(moduleId, projectionFieldNames, permission);
    }

    @Override
    public Mono<Tuple2<Module, String>> checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(
            String moduleId, Optional<String> workspaceIdOptional) {
        return repository
                .findById(moduleId, modulePermission.getCreateExecutablesPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)))
                .flatMap(module -> {
                    if (workspaceIdOptional.isPresent()) {
                        return Mono.zip(Mono.just(module), Mono.just(workspaceIdOptional.get()));
                    }

                    // Using the least level permission to fetch the package (to auto fill workspaceid). It is assumed
                    // that the developer has access to the package since she is editing a module in it by adding an
                    // action.
                    return packagePermissionChecker
                            .findById(module.getPackageId(), packagePermission.getReadPermission())
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, module.getPackageId())))
                            .flatMap(aPackage -> {
                                if (!StringUtils.hasLength(aPackage.getWorkspaceId())) {
                                    // This should never happen. If it does, it means that the package is not associated
                                    // with any workspace. This is a bad state and should be reported.
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                return Mono.zip(Mono.just(module), Mono.just(aPackage.getWorkspaceId()));
                            });
                });
    }
}
