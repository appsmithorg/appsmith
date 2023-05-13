package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface DatasourceStorageTransferSolutionCE {
    DatasourceStorage initializeDatasourceStorage(Datasource datasource, String environmentId);

    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentIdWithPermission(String datasourceId,
                                                                             String environmentId,
                                                                             AclPermission permission);

    Mono<DatasourceStorage> findByDatasourceAndEnvironmentId(Datasource datasource, String environmentId);
}
