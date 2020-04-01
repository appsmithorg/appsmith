package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface AppsmithRepository<T> {

    Mono<T> findById(String id, AclPermission permission);

    Mono<T> updateById(String id, T resource, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission);
}
