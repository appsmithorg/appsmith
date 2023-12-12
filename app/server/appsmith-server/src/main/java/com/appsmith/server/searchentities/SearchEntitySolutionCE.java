package com.appsmith.server.searchentities;

import com.appsmith.server.dtos.SearchEntityDTO;
import reactor.core.publisher.Mono;

public interface SearchEntitySolutionCE {
    Mono<SearchEntityDTO> searchEntity(
            String[] entities, String searchString, int page, int size, Boolean isRequestedForHomepage);
}
