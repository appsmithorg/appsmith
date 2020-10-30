package com.appsmith.server.services;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CollectionService extends CrudService<Collection, String> {
    Mono<Collection> findById(String id);

    Mono<Collection> addActionsToCollection(Collection collection, List<NewAction> actions);

    Mono<ActionDTO> addSingleActionToCollection(String collectionId, ActionDTO action);

    Mono<NewAction> removeSingleActionFromCollection(String collectionId, Mono<NewAction> action);
}
