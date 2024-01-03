package com.appsmith.server.newactions.moduleconvertible;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ModuleConvertibleMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.moduleconvertible.ModuleConvertibleServiceCECompatible;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public abstract class QueryModuleConvertibleServiceCECompatibleImpl
        implements ModuleConvertibleServiceCECompatible<NewAction, NewAction> {
    @Override
    public Mono<Void> convertToModule(ModuleConvertibleMetaDTO moduleConvertibleMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Reusable> getPublicEntityCandidateMono(String publicEntityId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
