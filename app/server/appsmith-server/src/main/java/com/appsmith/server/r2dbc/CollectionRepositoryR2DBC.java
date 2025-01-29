package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CollectionRepositoryR2DBC extends BaseR2DBCRepository<Collection, String> {

    @Query("SELECT * FROM collection WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<Collection> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM collection WHERE name = :name AND workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<Collection> findByNameAndWorkspaceId(String name, String workspaceId);
}
