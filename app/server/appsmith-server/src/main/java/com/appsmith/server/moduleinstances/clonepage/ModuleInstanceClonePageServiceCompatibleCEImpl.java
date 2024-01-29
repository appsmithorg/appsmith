package com.appsmith.server.moduleinstances.clonepage;

import com.appsmith.server.clonepage.ClonePageServiceCECompatible;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ModuleInstanceClonePageServiceCompatibleCEImpl implements ClonePageServiceCECompatible<ModuleInstance> {
    @Override
    public Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return Mono.empty().then();
    }

    @Override
    public Mono<Void> updateClonedEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
