package com.appsmith.server.moduleconvertible;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ModuleConvertibleMetaDTO;
import reactor.core.publisher.Mono;

public interface ModuleConvertibleServiceCECompatible<T, U extends BaseDomain> {
    Mono<Void> convertToModule(ModuleConvertibleMetaDTO moduleConvertibleMetaDTO);

    Mono<Reusable> getPublicEntityCandidateMono(String publicEntityCandidateId);
}
