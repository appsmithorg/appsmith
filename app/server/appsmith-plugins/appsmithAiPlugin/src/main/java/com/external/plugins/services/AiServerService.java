package com.external.plugins.services;

import com.external.plugins.dtos.AiServerRequestDTO;
import reactor.core.publisher.Mono;

public interface AiServerService {
    /**
     * Notify AI server about new datasource creation along with file context if provided
     */
    Mono<Boolean> createDatasource(String datasourceId, String files);

    /**
     * Execute a query on top of datasource on AI server and get back response
     */
    Mono<Object> executeQuery(String datasourceId, AiServerRequestDTO aiServerRequestDTO);
}
