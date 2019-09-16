package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationRepository extends BaseRepository<Application, String> {
    Flux<Application> findByOrganizationId(String orgId);

    Mono<Application> findByIdAndOrganizationId(String id, String orgId);

    Mono<Application> findById(String id);

    Mono<Application> findByName(String name);
}
