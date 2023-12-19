package com.appsmith.server.modules.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ModuleEntityServiceCECompatible<T extends BaseDomain> {

    Mono<T> createPrivateEntity(Reusable entity);

    Mono<List<Reusable>> getAllEntitiesForPackageEditor(String contextId, CreatorContextType contextType);
}
