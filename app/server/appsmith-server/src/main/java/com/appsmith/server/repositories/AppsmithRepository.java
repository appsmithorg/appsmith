package com.appsmith.server.repositories;

import com.appsmith.server.constants.AclPermission;
import reactor.core.publisher.Mono;

public interface AppsmithRepository<T> {

    Mono<T> findById(String id, AclPermission permission);

    Mono<T> updateById(String id, T resource, AclPermission permission);
}
