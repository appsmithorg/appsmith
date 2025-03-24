package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionCollectionUpdateDTO;
import jakarta.validation.Valid;
import reactor.core.publisher.Mono;

import java.util.List;

public interface LayoutCollectionServiceCE {

    Mono<ActionCollectionDTO> createCollection(ActionCollection actionCollection);

    Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection);

    Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO);

    Mono<Integer> updateUnpublishedActionCollectionBody(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> updateUnpublishedActionCollectionWithSpecificActions(String branchedActionCollectionId, ActionCollectionUpdateDTO resource);
}
