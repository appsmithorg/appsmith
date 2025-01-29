package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Config;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ConfigRepositoryR2DBC extends BaseR2DBCRepository<Config, String> {

    @Query("SELECT * FROM config WHERE name = :name AND deleted_at IS NULL")
    Mono<Config> findByName(String name);
}
