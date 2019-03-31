package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Query;
import com.mobtools.server.dtos.CommandQueryParams;
import com.mobtools.server.services.QueryService;
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

    @PostMapping("/execute/{id}")
    public Flux<Object> executeQuery(@PathVariable String id, @RequestBody CommandQueryParams params) {
        return service.executeQuery(id, params);
    }
}
