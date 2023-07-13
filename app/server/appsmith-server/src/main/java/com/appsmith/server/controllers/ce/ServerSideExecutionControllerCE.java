package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.ServerSideExecutionMetadataDTO;
import com.appsmith.server.services.ServerSideEndpointExecution;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@RequestMapping(Url.SERVER_JS_EXECUTE_URL)
public class ServerSideExecutionControllerCE {

    private final ServerSideEndpointExecution serverSideEndpointExecution;

    @JsonView(Views.Public.class)
    @GetMapping("")
    public Mono<ResponseDTO<ServerSideExecutionMetadataDTO>> generateServerExecutionUrl(
            @RequestParam(name = FieldName.ACTION_COLLECTION_ID) String actionCollectionId,
            @RequestParam(name = FieldName.ACTION_ID) String actionId) {

        log.debug(
                "Going to generate the remote execution endpoint for collection {}, action  {}",
                actionCollectionId,
                actionId);
        return serverSideEndpointExecution
                .generateServerExecutionUrl(actionCollectionId, actionId)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
