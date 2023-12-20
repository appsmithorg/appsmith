package com.appsmith.server.modules.moduleentity;

import com.appsmith.external.models.BaseDomain;
import reactor.core.publisher.Mono;

public interface ModulePublicEntityService<T extends BaseDomain> extends ModulePublicEntityServiceCECompatible<T> {
    Mono<Object> getPublicEntitySettingsForm(String moduleId);
}
