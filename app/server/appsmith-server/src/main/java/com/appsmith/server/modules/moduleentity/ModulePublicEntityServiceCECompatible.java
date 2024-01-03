package com.appsmith.server.modules.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Module;
import reactor.core.publisher.Mono;

public interface ModulePublicEntityServiceCECompatible<T extends BaseDomain> {
    Mono<Reusable> createPublicEntity(String workspaceId, Module module, Reusable entity);

    Mono<Object> getPublicEntitySettingsForm(String moduleId);

    Mono<Reusable> getPublicEntity(String moduleId);
}
