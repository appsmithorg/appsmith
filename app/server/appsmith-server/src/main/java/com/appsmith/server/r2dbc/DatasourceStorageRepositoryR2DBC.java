package com.appsmith.server.r2dbc;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DatasourceStorageRepositoryR2DBC extends BaseR2DBCRepository<DatasourceStorage, String> {

    @Query(
            "SELECT * FROM datasource_storage WHERE datasource_id = :datasourceId AND environment_id = :environmentId AND deleted_at IS NULL")
    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    @Query("SELECT * FROM datasource_storage WHERE datasource_id = :datasourceId AND deleted_at IS NULL")
    Flux<DatasourceStorage> findByDatasourceId(String datasourceId);
}
