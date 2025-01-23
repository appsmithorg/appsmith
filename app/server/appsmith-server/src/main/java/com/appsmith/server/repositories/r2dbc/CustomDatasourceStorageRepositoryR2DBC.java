package com.appsmith.server.repositories.r2dbc;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomDatasourceStorageRepositoryR2DBC extends BaseR2DBCRepository<DatasourceStorage, String> {

    @Query("SELECT * FROM datasource_storage WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<DatasourceStorage> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM datasource_storage WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<DatasourceStorage> findByIds(List<String> ids);

    @Query("SELECT * FROM datasource_storage WHERE plugin_id = :pluginId AND deleted_at IS NULL")
    Flux<DatasourceStorage> findByPluginId(String pluginId);
}
