package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface DatasourceStorageServiceCE {

    Flux<DatasourceStorage> findByDatasourceId(String datasourceId);
    Flux<DatasourceStorage> findAllByDatasourceIds(List<String> datasourceIds);
    Mono<DatasourceStorage> findOneByDatasourceId(String datasourceId);
    Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage);
    Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage);
    Mono<DatasourceStorage> findByDatasourceIdOrSave(Datasource datasource, String environmentId);

}
