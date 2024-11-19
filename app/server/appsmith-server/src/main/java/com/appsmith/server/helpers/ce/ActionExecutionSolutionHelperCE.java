package com.appsmith.server.helpers.ce;

import com.appsmith.external.dtos.ExecuteActionDTO;
import reactor.core.publisher.Mono;

public interface ActionExecutionSolutionHelperCE {
    Mono<ExecuteActionDTO> populateExecuteActionDTOWithSystemInfo(ExecuteActionDTO executeActionDTO);
}
