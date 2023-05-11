package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface DatasourceConfigurationStorageServiceCE {

    Flux<DatasourceConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds);

    Mono<DatasourceConfiguration> findOneDatasourceConfigurationByDatasourceId(Datasource datasource);

    Mono<DatasourceConfigurationStorage> archive(DatasourceConfigurationStorage datasourceConfigurationStorage);

}
