package com.external.plugins.services;

import com.external.plugins.dtos.AiServerRequestDTO;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public interface AiServerService {
    /**
     * Notify AI server about new datasource creation along with file context if provided
     */
    Mono<ArrayList<String>> createDatasource(ArrayList<String> files);

    /**
     * Upload files on AI server
     */
    Mono<Object> uploadFiles(List<FilePart> fileParts);

    /**
     * Execute a query on top of datasource on AI server and get back response
     */
    Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO, Map<String, String> headers);
}
