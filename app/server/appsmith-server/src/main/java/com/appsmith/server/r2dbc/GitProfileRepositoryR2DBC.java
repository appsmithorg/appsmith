package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface GitProfileRepositoryR2DBC extends BaseR2DBCRepository<GitProfile, String> {

    @Query("SELECT * FROM git_profile WHERE default_profile = true AND user_id = :userId AND deleted_at IS NULL")
    Mono<GitProfile> findDefaultProfile(String userId);

    @Query("SELECT * FROM git_profile WHERE user_id = :userId AND deleted_at IS NULL")
    Mono<GitProfile> findByUserId(String userId);
}
