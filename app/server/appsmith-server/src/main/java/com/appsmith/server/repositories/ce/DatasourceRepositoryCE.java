package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface DatasourceRepositoryCE extends BaseRepository<Datasource, String>, CustomDatasourceRepository {

    Flux<Datasource> findByIdIn(List<String> ids);

    Flux<Datasource> findAllByOrganizationId(String organizationId);

    Mono<Long> countByDeletedAtNull();

}
