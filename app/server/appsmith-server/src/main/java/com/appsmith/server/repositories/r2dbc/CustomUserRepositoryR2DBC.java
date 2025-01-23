package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CustomUserRepositoryR2DBC extends BaseR2DBCRepository<User, String> {

    @Query("SELECT * FROM users WHERE email IN (:emails) AND deleted_at IS NULL")
    Flux<User> findByEmails(List<String> emails);

    @Query("SELECT * FROM users WHERE workspace_id = :workspaceId AND deleted_at IS NULL")
    Flux<User> findByWorkspaceId(String workspaceId);

    @Query("SELECT * FROM users WHERE id IN (:ids) AND deleted_at IS NULL")
    Flux<User> findAllByIds(List<String> ids);
}
