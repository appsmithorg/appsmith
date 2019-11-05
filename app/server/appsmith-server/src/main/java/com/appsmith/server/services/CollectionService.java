package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Collection;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CollectionService extends CrudService<Collection, String> {
    Mono<Collection> findById(String id);
    Mono<Collection> addActionsToCollection(Collection collection, List<Action> actions);
    Mono<Action> addSingleActionToCollection(String collectionId, Action action);
    Mono<Action> removeSingleActionFromCollection(String collectionId, Action action);
}
