package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface TenantRepositoryR2DBC extends BaseR2DBCRepository<Tenant, String> {

    @Query("SELECT * FROM tenant WHERE slug = :slug AND deleted_at IS NULL")
    Mono<Tenant> findBySlug(String slug);
}
