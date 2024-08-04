package com.appsmith.server.services.ce;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import reactor.core.publisher.Mono;

public interface LayoutCollectionServiceCE {

    Mono<ActionCollectionDTO> createCollection(ActionCollection actionCollection);

    Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection);

    Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO);

    Mono<Integer> updateUnpublishedActionCollectionBody(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO);
}
