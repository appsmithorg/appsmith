package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.User;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserRepositoryR2DBC extends BaseR2DBCRepository<User, String> {

    @Query("SELECT * FROM users WHERE email = :email AND deleted_at IS NULL")
    Mono<User> findByEmail(String email);

    @Query("SELECT * FROM users WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<User> findByWorkspaceId(String workspaceId);

    @Query("SELECT COUNT(*) FROM users WHERE email = :email AND deleted_at IS NULL")
    Mono<Long> countByEmail(String email);
}
