package com.external.plugins.services;

import com.external.plugins.dtos.AiServerRequestDTO;
import reactor.core.publisher.Mono;

import java.util.ArrayList;

public interface AiServerService {
    /**
     * Notify AI server about new datasource creation along with file context if provided
     */
    Mono<ArrayList<String>> createDatasource(ArrayList<String> files);

    /**
     * Execute a query on top of datasource on AI server and get back response
     */
    Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO);
}
