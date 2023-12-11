package com.appsmith.server.newactions.moduleentity;

import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.moduleentity.ModuleEntityServiceCECompatible;
import reactor.core.publisher.Mono;

public class NewActionModuleEntityServiceCECompatibleImpl implements ModuleEntityServiceCECompatible<NewAction> {
    @Override
    public Mono<ModuleConsumable> createPublicEntity(String workspaceId, Module module, ModuleConsumable entity) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ModuleConsumable> createPrivateEntity(ModuleConsumable entity, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
