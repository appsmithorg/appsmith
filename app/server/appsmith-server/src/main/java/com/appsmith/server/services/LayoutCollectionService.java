package com.appsmith.server.services;

import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionCollectionNameDTO;
import com.appsmith.server.dtos.RefactorActionNameInCollectionDTO;
import reactor.core.publisher.Mono;

public interface LayoutCollectionService {
    Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection);

    Mono<LayoutDTO> refactorCollectionName(RefactorActionCollectionNameDTO refactorActionCollectionNameDTO);

    Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO);

    Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<LayoutDTO> refactorAction(RefactorActionNameInCollectionDTO refactorActionNameInCollectionDTO);
}
