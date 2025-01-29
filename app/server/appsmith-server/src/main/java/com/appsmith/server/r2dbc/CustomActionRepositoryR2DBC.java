package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomActionRepositoryR2DBC extends BaseR2DBCRepository<NewAction, String> {

    @Query("SELECT * FROM new_action WHERE page_id IN (:pageIds) AND deleted_at IS NULL")
    Flux<NewAction> findByPageIds(List<String> pageIds);

    @Query("SELECT * FROM new_action WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<NewAction> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM new_action WHERE collection_id = :collectionId AND deleted_at IS NULL")
    Flux<NewAction> findByCollectionId(String collectionId);

    @Query("SELECT * FROM new_action WHERE git_sync_id = :defaultApplicationId AND deleted_at IS NULL")
    Flux<NewAction> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId);
}
