package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ActionCollectionRepositoryR2DBC extends BaseR2DBCRepository<ActionCollection, String> {

    @Query("SELECT * FROM action_collection WHERE application_id = :applicationId AND deleted_at IS NULL")
    Flux<ActionCollection> findByApplicationId(String applicationId);

    @Query("SELECT * FROM action_collection WHERE page_id = :pageId AND deleted_at IS NULL")
    Flux<ActionCollection> findByPageId(String pageId);

    @Query("SELECT * FROM action_collection WHERE name = :name AND page_id = :pageId AND deleted_at IS NULL")
    Mono<ActionCollection> findByNameAndPageId(String name, String pageId);

    @Query("SELECT COUNT(*) FROM action_collection WHERE name = :name AND page_id = :pageId AND deleted_at IS NULL")
    Mono<Long> countByNameAndPageId(String name, String pageId);
}
