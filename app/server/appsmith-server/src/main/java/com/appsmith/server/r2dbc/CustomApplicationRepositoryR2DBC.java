package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Application;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomApplicationRepositoryR2DBC extends BaseR2DBCRepository<Application, String> {

    @Query("SELECT * FROM application WHERE git_sync_id = :defaultApplicationId AND deleted_at IS NULL")
    Flux<Application> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId);

    @Query("SELECT * FROM application WHERE workspace_id = :workspaceId AND is_public = true AND deleted_at IS NULL")
    Flux<Application> findByWorkspaceIdAndIsPublic(String workspaceId);

    @Query("SELECT * FROM application WHERE id IN (:applicationIds) AND deleted_at IS NULL")
    Flux<Application> findByIdIn(List<String> applicationIds);
}
