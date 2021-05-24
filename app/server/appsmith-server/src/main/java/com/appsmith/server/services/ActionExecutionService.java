package com.appsmith.server.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import reactor.core.publisher.Mono;

public interface ActionExecutionService {
    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);
}
