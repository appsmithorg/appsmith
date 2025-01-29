package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface UsagePulseRepositoryR2DBC extends BaseR2DBCRepository<UsagePulse, String> {

    @Query("SELECT * FROM usage_pulse WHERE user_id = :userId AND deleted_at IS NULL ORDER BY timestamp DESC")
    Flux<UsagePulse> findByUserIdOrderByTimestampDesc(String userId);
}
