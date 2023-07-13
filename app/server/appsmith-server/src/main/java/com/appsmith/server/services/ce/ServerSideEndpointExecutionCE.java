package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ServerSideExecutionMetadataDTO;
import reactor.core.publisher.Mono;

public interface ServerSideEndpointExecutionCE {

    Mono<ServerSideExecutionMetadataDTO> generateServerExecutionUrl(String collectionId, String actionId);
}
