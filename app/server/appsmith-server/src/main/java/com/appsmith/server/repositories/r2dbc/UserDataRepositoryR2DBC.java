package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserDataRepositoryR2DBC extends BaseR2DBCRepository<UserData, String> {

    @Query("SELECT * FROM user_data WHERE user_id = :userId AND deleted_at IS NULL")
    Mono<UserData> findByUserId(String userId);

    @Query("SELECT COUNT(*) FROM user_data WHERE user_id = :userId AND deleted_at IS NULL")
    Mono<Long> countByUserId(String userId);
}
