package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;

public interface DatasourceStorageServiceCE {

    Mono<DatasourceStorage> create(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> getDatasourceStorageForExecution(ActionDTO actionDTO, String environmentId);

    Mono<DatasourceStorage> findByDatasourceAndEnvironmentId(Datasource datasource,
                                                             String environmentId);

    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    Mono<DatasourceStorage> validateDatasourceStorage(DatasourceStorage datasourceStorage);

    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentIdWithPermission(String datasourceId, String environmentId, AclPermission aclPermission);

    Mono<DatasourceStorage> populateHintMessages(DatasourceStorage datasourceStorage);

    Map<String, Object> getAnalyticsProperties(DatasourceStorage datasourceStorage);
}
