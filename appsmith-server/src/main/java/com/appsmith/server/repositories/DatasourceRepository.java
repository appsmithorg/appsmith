package com.appsmith.server.repositories;

import com.appsmith.server.domains.Datasource;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DatasourceRepository extends BaseRepository<Datasource, String> {
    Mono<Datasource> findByName(String name);

    Mono<Datasource> findByIdAndOrganizationId(String id, String organizationId);

    Flux<Datasource> findAllByOrganizationId(String organizationId);

}
