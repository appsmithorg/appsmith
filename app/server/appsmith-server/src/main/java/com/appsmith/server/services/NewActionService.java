package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.NewAction;
import reactor.core.publisher.Mono;

import javax.validation.constraints.NotNull;

public interface NewActionService extends CrudService<NewAction, String> {
    Mono<Action> createAction(@NotNull Action action);

    Mono<Action> updateUnpublishedAction(String id, Action action);
}
