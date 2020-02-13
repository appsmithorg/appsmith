package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.springframework.data.domain.Example;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationRepository extends BaseRepository<Application, String> {

    Mono<Application> findByIdAndOrganizationId(String id, String orgId);

    Mono<Application> findByName(String name);

    @Override
    Flux<Application> findAll(Example example);

    @Override
    Mono<Application> findById(String id);
}
