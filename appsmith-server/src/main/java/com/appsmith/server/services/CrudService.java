package com.appsmith.server.services;

import com.appsmith.server.domains.BaseDomain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudService<T extends BaseDomain, ID> {

    Flux<T> get();

    Mono<T> create(T resource);

    Mono<T> update(ID id, T resource);

    Mono<T> getById(ID id);
}
