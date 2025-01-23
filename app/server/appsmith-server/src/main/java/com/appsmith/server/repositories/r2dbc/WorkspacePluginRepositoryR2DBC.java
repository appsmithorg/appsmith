package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface WorkspacePluginRepositoryR2DBC extends BaseR2DBCRepository<WorkspacePlugin, String> {

    @Query(
            "SELECT * FROM workspace_plugin WHERE workspace_id = :workspaceId AND plugin_id = :pluginId AND deleted_at IS NULL")
    Mono<WorkspacePlugin> findByWorkspaceIdAndPluginId(String workspaceId, String pluginId);

    @Query("SELECT * FROM workspace_plugin WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<WorkspacePlugin> findByWorkspaceId(String workspaceId);
}
