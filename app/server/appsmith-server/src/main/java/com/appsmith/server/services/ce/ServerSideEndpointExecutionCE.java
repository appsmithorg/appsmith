package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ServerSideExecutionRequestDTO;
import com.appsmith.server.dtos.ServerSideExecutionResponseDTO;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ServerSideEndpointExecutionCE {

    Mono<ServerSideExecutionResponseDTO> generateServerExecutionUrl(ServerSideExecutionRequestDTO requestDTO);

    Mono<Object> runAction(String actionId, String mode, Map<String, Object> params);
}
