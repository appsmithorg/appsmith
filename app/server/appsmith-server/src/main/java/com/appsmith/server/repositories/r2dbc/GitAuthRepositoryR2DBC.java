package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface GitAuthRepositoryR2DBC extends BaseR2DBCRepository<GitAuth, String> {

    @Query("SELECT * FROM git_auth WHERE user_id = :userId AND git_provider = :gitProvider AND deleted_at IS NULL")
    Mono<GitAuth> findByUserIdAndGitProvider(String userId, String gitProvider);
}
