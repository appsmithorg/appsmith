package com.appsmith.server.newactions.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityServiceCECompatible;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class NewActionModulePublicEntityServiceCECompatible
        implements ModulePublicEntityServiceCECompatible<NewAction> {
    @Override
    public Mono<ModuleConsumable> createPublicEntity(String workspaceId, Module module, ModuleConsumable entity) {
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
