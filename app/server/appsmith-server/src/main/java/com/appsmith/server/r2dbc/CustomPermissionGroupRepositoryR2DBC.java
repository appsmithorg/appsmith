package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomPermissionGroupRepositoryR2DBC extends BaseR2DBCRepository<PermissionGroup, String> {

    @Query("SELECT * FROM permission_group WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<PermissionGroup> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM permission_group WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<PermissionGroup> findByIds(List<String> ids);
}
