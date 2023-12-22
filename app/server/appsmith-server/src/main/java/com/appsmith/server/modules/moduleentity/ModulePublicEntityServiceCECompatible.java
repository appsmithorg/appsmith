package com.appsmith.server.modules.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Module;
import com.appsmith.server.helpers.ModuleConsumable;
import reactor.core.publisher.Mono;

public interface ModulePublicEntityServiceCECompatible<T extends BaseDomain> {
    Mono<ModuleConsumable> createPublicEntity(String workspaceId, Module module, ModuleConsumable entity);

    Mono<Object> getPublicEntitySettingsForm(String moduleId);

    Mono<Reusable> getPublicEntity(String moduleId);
}
