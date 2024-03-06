package com.appsmith.server.moduleinstances.permissions;

import reactor.core.publisher.Mono;

public interface ModuleInstancePermissionChecker {
    Mono<Long> getModuleInstanceCountByModuleUUID(String moduleUUID, String workspaceId);
}
