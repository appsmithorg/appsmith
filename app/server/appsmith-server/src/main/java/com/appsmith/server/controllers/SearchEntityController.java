package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.SearchEntityControllerCE;
import com.appsmith.server.searchentities.SearchEntitySolution;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping(Url.SEARCH_ENTITY_URL)
@RestController
public class SearchEntityController extends SearchEntityControllerCE {

    public SearchEntityController(SearchEntitySolution searchEntitySolution) {
        super(searchEntitySolution);
    }
}
