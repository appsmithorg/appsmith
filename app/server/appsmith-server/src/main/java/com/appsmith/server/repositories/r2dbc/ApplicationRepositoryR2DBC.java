package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationRepositoryR2DBC extends BaseR2DBCRepository<Application, String> {

    @Query("SELECT * FROM application WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<Application> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM application WHERE name = :name AND workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<Application> findByNameAndWorkspaceId(String name, String workspaceId);

    @Query("SELECT COUNT(*) FROM application WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<Long> countByWorkspaceId(String workspaceId);
}
