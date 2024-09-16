package com.appsmith.server.solutions.ce;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.dtos.ExecuteActionMetaDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ActionExecutionSolutionCE {
    Mono<ActionExecutionResult> executeAction(
            Flux<Part> partFlux, String environmentId, HttpHeaders httpHeaders, Boolean operateWithoutPermission);

    Mono<ActionExecutionResult> executeAction(
            ExecuteActionDTO executeActionDTO, ExecuteActionMetaDTO executeActionMetaDTO);

    Mono<ActionDTO> getValidActionForExecution(
            ExecuteActionDTO executeActionDTO, ExecuteActionMetaDTO executeActionMetaDTO);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);
}
