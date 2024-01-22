package com.appsmith.server.jslibs.context;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.mongodb.client.result.UpdateResult;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface ContextBasedJsLibServiceCE<T extends BaseDomain> {

    /**
     * Retrieves all the global JS libs associated with this context
     * @param contextId
     * @param branchName
     * @param isViewMode
     * @return
     */
    Mono<Set<CustomJSLibContextDTO>> getAllVisibleJSLibContextDTOFromContext(
            @NotNull String contextId, String branchName, Boolean isViewMode);

    Mono<UpdateResult> updateJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> customJSLibContextDTOS);
}
