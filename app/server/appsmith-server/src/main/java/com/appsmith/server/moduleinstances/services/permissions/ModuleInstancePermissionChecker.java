package com.appsmith.server.moduleinstances.services.permissions;

import reactor.core.publisher.Mono;

public interface ModuleInstancePermissionChecker {
    Mono<Long> getModuleInstanceCountByModuleId(String moduleId);
}
