package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomNewPageRepositoryR2DBC extends BaseR2DBCRepository<NewPage, String> {

    @Query(
            "SELECT * FROM new_page WHERE application_id = :applicationId AND deleted_at IS NULL ORDER BY created_at ASC")
    Flux<NewPage> findByApplicationIdAndNonDeletedPages(String applicationId);

    @Query("SELECT * FROM new_page WHERE git_sync_id = :defaultApplicationId AND deleted_at IS NULL")
    Flux<NewPage> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId);

    @Query("SELECT * FROM new_page WHERE id IN (:pageIds) AND deleted_at IS NULL")
    Flux<NewPage> findAllByIds(List<String> pageIds);
}
