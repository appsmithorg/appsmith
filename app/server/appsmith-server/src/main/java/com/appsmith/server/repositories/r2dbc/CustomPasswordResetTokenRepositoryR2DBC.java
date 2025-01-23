package com.appsmith.server.repositories.r2dbc;

import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.Instant;

@Repository
public interface CustomPasswordResetTokenRepositoryR2DBC extends BaseR2DBCRepository<PasswordResetToken, String> {

    @Query("SELECT * FROM password_reset_token WHERE created_at < :instant AND deleted_at IS NULL")
    Flux<PasswordResetToken> findByExpiryTimeBefore(Instant instant);
}
