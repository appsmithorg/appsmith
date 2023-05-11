package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface DatasourceConfigurationStorageServiceCE {

    Flux<DatasourceConfigurationStorage> findByDatasourceId(Datasource datasource);

    Flux<DatasourceConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds);

    Mono<DatasourceConfigurationStorage> findOneByDatasourceId(String datasourceId);

    Mono<DatasourceConfigurationStorage> archive(DatasourceConfigurationStorage datasourceConfigurationStorage);

}
