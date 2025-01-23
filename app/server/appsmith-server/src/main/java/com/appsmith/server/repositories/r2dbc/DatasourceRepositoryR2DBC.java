package com.appsmith.server.repositories.r2dbc;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DatasourceRepositoryR2DBC extends BaseR2DBCRepository<Datasource, String> {

    @Query("SELECT * FROM datasource WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<Datasource> findAllByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM datasource WHERE name = :name AND workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId);

    @Query("SELECT COUNT(*) FROM datasource WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<Long> countByWorkspaceId(String workspaceId);
}
