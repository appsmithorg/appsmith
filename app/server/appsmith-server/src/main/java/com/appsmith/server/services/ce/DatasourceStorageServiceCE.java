package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.dsl.CaseBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface DatasourceStorageServiceCE {

    Mono<DatasourceStorage> create(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> getDatasourceStorageForExecution(ActionDTO actionDTO, String environmentId);

    Mono<DatasourceStorage> findByDatasourceAndEnvironmentId(Datasource datasource,
                                                             String environmentId);

    Flux<DatasourceStorage> findByDatasource(Datasource datasource);

    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    Flux<DatasourceStorage> findStrictlyByDatasourceId(String datasourceId);

    Mono<DatasourceStorage> updateByDatasourceAndEnvironmentId(Datasource datasource, String environmentId, Boolean isUserRefreshedUpdate);

    Mono<DatasourceStorage> validateDatasourceStorage(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId, AclPermission aclPermission);

    Mono<DatasourceStorage> populateHintMessages(DatasourceStorage datasourceStorage);

    Map<String, Object> getAnalyticsProperties(DatasourceStorage datasourceStorage);

    DatasourceStorage initializeDatasourceStorage(Datasource datasource, String environmentId);
}
