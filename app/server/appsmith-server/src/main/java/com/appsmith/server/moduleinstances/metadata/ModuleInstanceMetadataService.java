package com.appsmith.server.moduleinstances.metadata;

import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface ModuleInstanceMetadataService {
    Mono<Long> getModuleInstanceCountByApplicationId(String applicationId, AclPermission permission);
}
