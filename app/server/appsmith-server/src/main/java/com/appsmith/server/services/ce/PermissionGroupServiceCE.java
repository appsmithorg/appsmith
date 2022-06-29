package com.appsmith.server.services.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface PermissionGroupServiceCE extends CrudService<PermissionGroup, String> {

    Flux<PermissionGroup> findAllByIds(Set<String> ids);

    Mono<PermissionGroup> save(PermissionGroup permissionGroup);
}
