package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Collection;
import reactor.core.publisher.Mono;

public interface ActionCollectionService {
    Mono<Collection> createCollection(Collection collection);
    Mono<Action> createAction(Action action);
    Mono<Action> updateAction(String id, Action action);
}
