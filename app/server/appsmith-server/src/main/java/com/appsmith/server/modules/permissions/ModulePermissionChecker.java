package com.appsmith.server.modules.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Optional;

public interface ModulePermissionChecker {
    Mono<Module> findById(String moduleId, AclPermission permission);

    Mono<Tuple2<Module, String>> checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(
            String moduleId, Optional<String> workspaceIdOptional);
}
