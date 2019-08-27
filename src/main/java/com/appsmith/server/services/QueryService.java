package com.appsmith.server.services;

import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import reactor.core.publisher.Flux;

public interface QueryService extends CrudService<Query, String> {

    Flux<Object> executeQuery(String name, CommandQueryParams params);
}
