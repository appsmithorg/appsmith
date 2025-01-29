package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomPluginRepositoryR2DBC extends BaseR2DBCRepository<Plugin, String> {

    @Query("SELECT * FROM plugin WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<Plugin> findAllByIds(List<String> ids);

    @Query("SELECT * FROM plugin WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<Plugin> findByWorkspaceId(String workspaceId);
}
