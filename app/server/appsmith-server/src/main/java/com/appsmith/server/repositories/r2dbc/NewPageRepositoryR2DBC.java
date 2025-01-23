package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NewPageRepositoryR2DBC extends BaseR2DBCRepository<NewPage, String> {

    @Query("SELECT * FROM new_page WHERE application_id = :applicationId AND deleted_at IS NULL")
    Flux<NewPage> findByApplicationId(String applicationId);

    @Query("SELECT * FROM new_page WHERE name = :name AND application_id = :applicationId AND deleted_at IS NULL")
    Mono<NewPage> findByNameAndApplicationId(String name, String applicationId);

    @Query(
            "SELECT * FROM new_page WHERE custom_slug = :customSlug AND application_id = :applicationId AND deleted_at IS NULL")
    Mono<NewPage> findByCustomSlugAndApplicationId(String customSlug, String applicationId);
}
