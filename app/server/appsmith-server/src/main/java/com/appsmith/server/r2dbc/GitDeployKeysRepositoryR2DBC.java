package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface GitDeployKeysRepositoryR2DBC extends BaseR2DBCRepository<GitDeployKeys, String> {

    @Query("SELECT * FROM git_deploy_keys WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Mono<GitDeployKeys> findByWorkspaceId(String workspaceId);
}
