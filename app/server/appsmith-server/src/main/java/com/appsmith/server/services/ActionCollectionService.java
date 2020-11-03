package com.appsmith.server.services;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.dtos.ActionDTO;
import reactor.core.publisher.Mono;

public interface ActionCollectionService {
    Mono<Collection> createCollection(Collection collection);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);
}
