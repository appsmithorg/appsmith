package com.appsmith.server.actioncollections.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityServiceCECompatible;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ActionCollectionModulePublicEntityServiceCECompatible
        implements ModulePublicEntityServiceCECompatible<ActionCollection> {
    @Override
    public Mono<Reusable> createPublicEntity(String workspaceId, Module module, Reusable entity) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Object> getPublicEntitySettingsForm(String moduleId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Reusable> getPublicEntity(String moduleId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
