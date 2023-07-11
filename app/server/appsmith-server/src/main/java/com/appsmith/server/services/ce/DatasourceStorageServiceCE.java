package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface DatasourceStorageServiceCE {

    Mono<DatasourceStorage> create(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> findByDatasourceAndEnvironmentId(Datasource datasource, String environmentId);

    Mono<DatasourceStorage> findByDatasourceAndEnvironmentIdForExecution(Datasource datasource, String environmentId);

    Flux<DatasourceStorage> findByDatasource(Datasource datasource);

    Flux<DatasourceStorage> findStrictlyByDatasourceId(String datasourceId);

    Mono<DatasourceStorage> findStrictlyByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    Mono<DatasourceStorage> updateDatasourceStorage(
            DatasourceStorage datasourceStorage, String activeEnvironmentId, Boolean IsUserRefreshedUpdate);

    Mono<DatasourceStorage> validateDatasourceStorage(DatasourceStorage datasourceStorage, Boolean onlyConfiguration);

    Mono<DatasourceStorage> validateDatasourceConfiguration(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> checkEnvironment(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> populateHintMessages(DatasourceStorage datasourceStorage);

    Map<String, Object> getAnalyticsProperties(DatasourceStorage datasourceStorage);

    DatasourceStorageDTO getDatasourceStorageDTOFromDatasource(Datasource datasource, String environmentId);

    DatasourceStorage getDatasourceStorageFromDatasource(Datasource datasource, String environmentId);
}
