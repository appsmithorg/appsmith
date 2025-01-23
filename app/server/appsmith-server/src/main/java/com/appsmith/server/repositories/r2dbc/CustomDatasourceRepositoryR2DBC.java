package com.appsmith.server.repositories.r2dbc;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomDatasourceRepositoryR2DBC extends BaseR2DBCRepository<Datasource, String> {

    @Query(
            "SELECT * FROM datasource WHERE workspace_id = :workspaceId AND is_template = :isTemplate AND deleted_at IS NULL")
    Flux<Datasource> findAllByWorkspaceIdAndIsTemplate(String workspaceId, boolean isTemplate);

    @Query("SELECT * FROM datasource WHERE git_sync_id = :defaultApplicationId AND deleted_at IS NULL")
    Flux<Datasource> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId);

    @Query("SELECT * FROM datasource WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<Datasource> findAllByIds(List<String> ids);
}
