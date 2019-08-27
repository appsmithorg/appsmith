package com.appsmith.server.controllers;

import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import com.appsmith.server.services.QueryService;
import com.appsmith.server.constants.Url;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping(Url.QUERY_URL)
public class QueryController extends BaseController<QueryService, Query, String> {

    @Autowired
    public QueryController(QueryService service) {
        super(service);
    }

    @PostMapping("/execute/{name}")
    public Flux<Object> executeQuery(@PathVariable String name, @RequestBody CommandQueryParams params) {
        return service.executeQuery(name, params);
    }
}
