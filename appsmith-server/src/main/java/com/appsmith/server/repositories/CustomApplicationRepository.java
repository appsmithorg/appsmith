package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface CustomApplicationRepository {
    Mono<Application> findByIdAndOrganizationId(String id, String orgId);

    Mono<Application> findByName(String name);
}
