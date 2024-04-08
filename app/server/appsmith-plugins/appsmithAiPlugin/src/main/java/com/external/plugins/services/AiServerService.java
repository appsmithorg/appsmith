package com.external.plugins.services;

import com.external.plugins.dtos.AiServerRequestDTO;
import com.external.plugins.dtos.AssociateDTO;
import com.external.plugins.dtos.FileStatusDTO;
import com.external.plugins.dtos.SourceDetails;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

import java.util.List;

public interface AiServerService {
    /**
     * Notify AI server about new datasource creation along with file context if provided
     */
    Mono<Void> associateDatasource(AssociateDTO associateDTO);
    /**
     * Notify AI server about datasource deletion along with file context if provided
     */
    Mono<Void> disassociateDatasource(AssociateDTO associateDTO);

    Mono<FileStatusDTO> getFilesStatus(List<String> fileIds, SourceDetails sourceDetails);

    /**
     * Upload files on AI server
     */
    Mono<Object> uploadFiles(List<FilePart> fileParts, SourceDetails sourceDetails);

    /**
     * Execute a query on top of datasource on AI server and get back response
     */
    Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO, SourceDetails sourceDetails);
}
