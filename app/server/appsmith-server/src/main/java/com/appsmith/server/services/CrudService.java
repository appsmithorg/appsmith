package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.AclConstants;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudService<T extends BaseDomain, ID> {

    @PreAuthorize("hasPermission(#this.this, 'read')")
    @AclPermission(values = AclConstants.READ_PERMISSION)
    Flux<T> get(MultiValueMap<String, String> params);

    @PreAuthorize("hasPermission(#this.this, 'create')")
    @AclPermission(values = AclConstants.CREATE_PERMISSION)
    Mono<T> create(T resource);

    @PreAuthorize("hasPermission(#this.this, 'update')")
    @AclPermission(values = AclConstants.UPDATE_PERMISSION)
    Mono<T> update(ID id, T resource);

    @PreAuthorize("hasPermission(#this.this, 'read')")
    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<T> getById(ID id);

    @PreAuthorize("hasPermission(#this.this, 'delete')")
    @AclPermission(values = AclConstants.DELETE_PERMISSION)
    Mono<T> delete(ID id);
}
