package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import com.appsmith.server.services.QueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
