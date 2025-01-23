package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PermissionGroupRepositoryR2DBC extends BaseR2DBCRepository<PermissionGroup, String> {

    @Query("SELECT * FROM permission_group WHERE assigned_to_user_id = :userId AND deleted_at IS NULL")
    Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspace(String userId);

    @Query("SELECT * FROM permission_group WHERE name = :name AND workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<PermissionGroup> findByNameAndWorkspaceId(String name, String workspaceId);
}
