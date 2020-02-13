package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudService<T extends BaseDomain, ID> {

    Flux<T> get(MultiValueMap<String, String> params);

    Mono<T> create(T resource);

    Mono<T> update(ID id, T resource);

//    @PreAuthorize("hasPermission('someValue', @aclComponent.getPermission(#returnObject))")
    Mono<T> getById(ID id);

    Mono<T> delete(ID id);
}
