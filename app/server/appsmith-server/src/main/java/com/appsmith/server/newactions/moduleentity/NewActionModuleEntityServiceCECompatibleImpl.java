package com.appsmith.server.newactions.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.moduleentity.ModuleEntityServiceCECompatible;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class NewActionModuleEntityServiceCECompatibleImpl implements ModuleEntityServiceCECompatible<NewAction> {

    @Override
    public Mono<NewAction> createPrivateEntity(Reusable entity) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<Reusable>> getAllEntitiesForPackageEditor(String contextId, CreatorContextType contextType) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
