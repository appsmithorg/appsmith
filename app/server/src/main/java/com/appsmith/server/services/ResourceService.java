package com.appsmith.server.services;

import com.appsmith.server.domains.Resource;
import reactor.core.publisher.Mono;

public interface ResourceService extends CrudService<Resource, String> {

    Mono<Resource> findByName(String name);

    Mono<Resource> findById(String id);
}
