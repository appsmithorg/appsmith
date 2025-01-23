package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomWorkspaceRepositoryR2DBC extends BaseR2DBCRepository<Workspace, String> {

    @Query("SELECT * FROM workspace WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<Workspace> findAllByIds(List<String> ids);

    @Query("SELECT * FROM workspace WHERE tenant_id = :tenantId AND deleted_at IS NULL")
    Flux<Workspace> findByTenantId(String tenantId);
}
