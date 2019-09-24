package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.ExecuteActionDTO;
import reactor.core.publisher.Flux;

public interface ActionService extends CrudService<Action, String> {

    Flux<Object> executeAction(ExecuteActionDTO executeActionDTO);
}
