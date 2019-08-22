package com.mobtools.server.services;

import com.mobtools.server.domains.BaseDomain;
import com.mobtools.server.exceptions.MobtoolsException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudService<T extends BaseDomain, ID> {

    Flux<T> get();

    Mono<T> create(T resource) throws MobtoolsException;

    Mono<T> update(ID id, T resource) throws Exception;

    Mono<T> getById(ID id);
}
