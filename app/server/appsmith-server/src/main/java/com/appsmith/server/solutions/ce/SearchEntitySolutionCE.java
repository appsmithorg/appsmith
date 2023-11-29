package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.SearchEntityDTO;
import reactor.core.publisher.Mono;

public interface SearchEntitySolutionCE {
    Mono<SearchEntityDTO> searchEntity(String searchString, int page, int size);
}
