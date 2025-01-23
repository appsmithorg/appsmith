package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ThemeRepositoryR2DBC extends BaseR2DBCRepository<Theme, String> {

    @Query("SELECT * FROM theme WHERE application_id = :applicationId AND deleted_at IS NULL")
    Mono<Theme> findByApplicationId(String applicationId);

    @Query("SELECT * FROM theme WHERE name = :name AND is_system_theme = true AND deleted_at IS NULL")
    Mono<Theme> findSystemThemeByName(String name);

    @Query("SELECT * FROM theme WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<Theme> findByWorkspaceId(String workspaceId);
}
