package com.appsmith.server.services.ce;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface UserGroupServiceCE extends CrudService<UserGroup, String> {

    Flux<UserGroup> findAllByIds(Set<String> ids);

    Mono<UserGroup> save(UserGroup userGroup);
}
