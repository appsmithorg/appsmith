package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CustomJSLibRepositoryR2DBC extends BaseR2DBCRepository<CustomJSLib, String> {

    @Query("SELECT * FROM custom_js_lib WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<CustomJSLib> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM custom_js_lib WHERE name = :name AND workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<CustomJSLib> findByNameAndWorkspaceId(String name, String workspaceId);
}
