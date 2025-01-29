package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PluginRepositoryR2DBC extends BaseR2DBCRepository<Plugin, String> {

    @Query("SELECT * FROM plugin WHERE package_name = :packageName AND deleted_at IS NULL")
    Mono<Plugin> findByPackageName(String packageName);

    @Query("SELECT * FROM plugin WHERE type = :type AND deleted_at IS NULL")
    Flux<Plugin> findByType(String type);

    @Query("SELECT * FROM plugin WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<Plugin> findByWorkspaceId(String workspaceId);
}
