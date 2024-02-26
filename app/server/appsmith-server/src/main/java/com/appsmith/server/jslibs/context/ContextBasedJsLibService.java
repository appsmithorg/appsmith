package com.appsmith.server.jslibs.context;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface ContextBasedJsLibService<T extends BaseDomain> extends ContextBasedJsLibServiceCE<T> {
    Mono<Set<CustomJSLibContextDTO>> getAllHiddenJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode);

    Mono<Integer> updateHiddenJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> updatedHiddenJSLibDTOSet);
}
