package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.ServerSideExecutionRequestDTO;
import com.appsmith.server.dtos.ServerSideExecutionResponseDTO;
import com.appsmith.server.services.ServerSideEndpointExecution;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@RequestMapping(Url.SERVER_JS_EXECUTE_URL)
public class ServerSideExecutionControllerCE {

    private final ServerSideEndpointExecution serverSideEndpointExecution;

    @JsonView(Views.Public.class)
    @PutMapping
    public Mono<ResponseDTO<ServerSideExecutionResponseDTO>> generateServerExecutionUrl(
            @RequestBody ServerSideExecutionRequestDTO requestDTO) {

        log.debug(
                "Going to generate the remote execution endpoint for collection {}, action  {}",
                requestDTO.getCollectionId(),
                requestDTO.getActionId());
        return serverSideEndpointExecution
                .generateServerExecutionUrl(requestDTO)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
