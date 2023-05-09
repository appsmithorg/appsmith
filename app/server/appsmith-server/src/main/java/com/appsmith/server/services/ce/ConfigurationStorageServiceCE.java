package com.appsmith.server.services.ce;

import com.appsmith.external.models.ConfigurationStorage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ConfigurationStorageServiceCE {

    Flux<ConfigurationStorage> findByDatasourceId(String datasourceId);
    Flux<ConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds);
    Mono<ConfigurationStorage> findOneByDatasourceId(String datasourceId);
    Mono<ConfigurationStorage> save(ConfigurationStorage configurationStorage);
    Mono<ConfigurationStorage> archive(ConfigurationStorage configurationStorage);



}
