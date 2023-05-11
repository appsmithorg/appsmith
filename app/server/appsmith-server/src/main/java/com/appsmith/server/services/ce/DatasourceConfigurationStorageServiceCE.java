package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface DatasourceConfigurationStorageServiceCE {

    Flux<DatasourceConfigurationStorage> findByDatasourceId(String datasourceId);
    Flux<DatasourceConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds);
    Mono<DatasourceConfigurationStorage> findOneByDatasourceId(String datasourceId);
    Mono<DatasourceConfigurationStorage> save(DatasourceConfigurationStorage datasourceConfigurationStorage);
    Mono<DatasourceConfigurationStorage> archive(DatasourceConfigurationStorage datasourceConfigurationStorage);
    Flux<DatasourceConfigurationStorage> archiveByDatasourceId(String datasourceId);
    Mono<DatasourceConfigurationStorage> findByDatasourceIdOrSave(Datasource datasource, String environmentId);
    Mono<DatasourceConfigurationStorage> getDatasourceConfigurationStorageByDatasourceId(String datasourceId);

}
