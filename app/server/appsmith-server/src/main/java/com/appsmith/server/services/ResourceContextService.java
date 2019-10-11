package com.appsmith.server.services;

import com.appsmith.server.domains.ResourceContext;
import reactor.core.publisher.Mono;

public interface ResourceContextService {

    /**
     * This function is responsible for returning the resource context stored
     * against the resource id. In case the resourceId is not found in the
     * map, create a new resource context and return that.
     * @param resourceId
     * @return ResourceContext
     */
    Mono<ResourceContext> getResourceContext(String resourceId);

    Mono<ResourceContext> deleteResourceContext(String resourceId);
}
