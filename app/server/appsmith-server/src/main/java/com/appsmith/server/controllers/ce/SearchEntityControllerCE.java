package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.searchentities.SearchEntitySolution;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

@RequestMapping(Url.SEARCH_ENTITY_URL)
@Slf4j
public class SearchEntityControllerCE {

    private final SearchEntitySolution searchEntitySolution;

    public SearchEntityControllerCE(SearchEntitySolution searchEntitySolution) {
        this.searchEntitySolution = searchEntitySolution;
    }

    @JsonView(Views.Public.class)
    @GetMapping("")
    public Mono<ResponseDTO<SearchEntityDTO>> getAllUnpublishedActionCollections(
            @RequestParam(required = false) String[] entities,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        log.debug("Going to search for entities with search string: {}", keyword);
        return searchEntitySolution
                .searchEntity(entities, keyword, page, size, Boolean.TRUE)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }
}
