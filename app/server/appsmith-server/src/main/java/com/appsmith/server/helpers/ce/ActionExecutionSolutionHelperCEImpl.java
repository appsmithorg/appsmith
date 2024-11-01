package com.appsmith.server.helpers.ce;

import com.appsmith.external.dtos.ExecuteActionDTO;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ActionExecutionSolutionHelperCEImpl implements ActionExecutionSolutionHelperCE {
    @Override
    public Mono<ExecuteActionDTO> populateExecuteActionDTOWithSystemInfo(ExecuteActionDTO executeActionDTO) {
        return Mono.just(executeActionDTO);
    }
}
