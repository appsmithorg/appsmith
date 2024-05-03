package com.appsmith.server.clonepage;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import reactor.core.publisher.Mono;

public interface ClonePageServiceCE<T extends BaseDomain> {
    Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO);
}
