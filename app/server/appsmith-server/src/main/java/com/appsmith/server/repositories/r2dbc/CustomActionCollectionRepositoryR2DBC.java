package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomActionCollectionRepositoryR2DBC extends BaseR2DBCRepository<ActionCollection, String> {

    @Query("SELECT * FROM action_collection WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<ActionCollection> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM action_collection WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<ActionCollection> findByIds(List<String> ids);

    @Query("SELECT * FROM action_collection WHERE git_sync_id = :defaultApplicationId AND deleted_at IS NULL")
    Flux<ActionCollection> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId);
}
