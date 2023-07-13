package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ServerSideExecutionRequestDTO;
import com.appsmith.server.dtos.ServerSideExecutionResponseDTO;
import reactor.core.publisher.Mono;

public interface ServerSideEndpointExecutionCE {

    Mono<ServerSideExecutionResponseDTO> generateServerExecutionUrl(ServerSideExecutionRequestDTO requestDTO);
}
