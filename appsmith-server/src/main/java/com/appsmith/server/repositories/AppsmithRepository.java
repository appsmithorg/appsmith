package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AppsmithRepository<T> {

    Mono<T> findById(String id, AclPermission permission);

    Mono<T> updateById(String id, T resource, AclPermission permission);

    Flux<T> findAll(Example<T> example, AclPermission permission);

    Flux<T> findAll(Example<T> example, Sort sort, AclPermission permission);
}
