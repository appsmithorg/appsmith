package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.AclConstants;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudService<T extends BaseDomain, ID> {

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Flux<T> get(MultiValueMap<String, String> params);

    @AclPermission(values = AclConstants.CREATE_PERMISSION)
    Mono<T> create(T resource);

    @AclPermission(values = AclConstants.UPDATE_PERMISSION)
    Mono<T> update(ID id, T resource);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<T> getById(ID id);

    @AclPermission(values = AclConstants.DELETE_PERMISSION)
    Mono<T> delete(ID id);
}
