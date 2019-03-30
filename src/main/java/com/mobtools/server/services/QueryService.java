package com.mobtools.server.services;

import com.mobtools.server.domains.Query;
import com.mobtools.server.dtos.CommandQueryParams;
import reactor.core.publisher.Flux;

import java.util.stream.DoubleStream;

public interface QueryService extends CrudService<Query, String> {

    Flux<Object> executeQuery(String id, CommandQueryParams params);
}
