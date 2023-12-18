package com.appsmith.server.actioncollections.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.moduleentity.ModuleEntityServiceCECompatible;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ActionCollectionModuleEntityServiceCECompatibleImpl
        implements ModuleEntityServiceCECompatible<ActionCollection> {

    @Override
    public Mono<ActionCollection> createPrivateEntity(Reusable entity) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<Reusable>> getAllEntitiesForPackageEditor(String contextId, CreatorContextType contextType) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
