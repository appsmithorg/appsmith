package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ConfigurationStorage;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomConfigurationStorageRepositoryCE extends AppsmithRepository<ConfigurationStorage> {
    Flux<ConfigurationStorage> findByDatasourceId(String datasourceId);
    Flux<ConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds);
    Mono<ConfigurationStorage> findOneByDatasourceId(String datasourceId);
}
