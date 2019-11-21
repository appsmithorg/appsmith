package com.appsmith.server.services;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.ExecuteActionDTO;
import reactor.core.publisher.Mono;

public interface ActionService extends CrudService<Action, String> {

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);

    Mono<Action> save(Action action);

    Mono<Action> findByName(String name);
}
