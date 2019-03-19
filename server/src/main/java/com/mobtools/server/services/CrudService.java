package com.mobtools.server.services;

import com.mobtools.server.domains.BaseDomain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudService<T extends BaseDomain, ID> {

    Flux<T> get();

    Mono<T> create(T resource);

    Mono<T> update(ID id, T resource) throws Exception;
}
