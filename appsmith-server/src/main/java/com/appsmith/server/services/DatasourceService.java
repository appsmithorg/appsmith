package com.appsmith.server.services;

import com.appsmith.server.domains.Datasource;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface DatasourceService extends CrudService<Datasource, String> {

    Mono<Datasource> findByName(String name);

    Mono<Datasource> findById(String id);

    Set<String> extractKeysFromDatasource(Datasource datasource);

    Mono<Datasource> validateDatasource(Datasource datasource);
}
