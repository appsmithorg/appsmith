package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.solutions.SearchEntitySolution;
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
            @RequestParam(required = false) String searchString) {
        log.debug("Going to search for entities with search string: {}", searchString);
        return searchEntitySolution
                .searchEntity(searchString, 0, 10)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
