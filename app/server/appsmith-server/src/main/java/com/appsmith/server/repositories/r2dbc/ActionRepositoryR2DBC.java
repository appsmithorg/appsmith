package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ActionRepositoryR2DBC extends BaseR2DBCRepository<NewAction, String> {

    @Query("SELECT * FROM new_action WHERE application_id = :applicationId AND deleted_at IS NULL")
    Flux<NewAction> findByApplicationId(String applicationId);

    @Query("SELECT * FROM new_action WHERE page_id = :pageId AND deleted_at IS NULL")
    Flux<NewAction> findByPageId(String pageId);

    @Query("SELECT * FROM new_action WHERE name = :name AND page_id = :pageId AND deleted_at IS NULL")
    Mono<NewAction> findByNameAndPageId(String name, String pageId);

    @Query("SELECT COUNT(*) FROM new_action WHERE name = :name AND page_id = :pageId AND deleted_at IS NULL")
    Mono<Long> countByNameAndPageId(String name, String pageId);
}
