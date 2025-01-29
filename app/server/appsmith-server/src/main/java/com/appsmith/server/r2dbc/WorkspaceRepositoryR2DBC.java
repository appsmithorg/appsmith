package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface WorkspaceRepositoryR2DBC extends BaseR2DBCRepository<Workspace, String> {

    @Query("SELECT * FROM workspace WHERE slug = :slug AND deleted_at IS NULL")
    Mono<Workspace> findBySlug(String slug);

    @Query("SELECT * FROM workspace WHERE name = :name AND deleted_at IS NULL")
    Mono<Workspace> findByName(String name);

    @Query("SELECT COUNT(*) FROM workspace WHERE name = :name AND deleted_at IS NULL")
    Mono<Long> countByName(String name);
}
