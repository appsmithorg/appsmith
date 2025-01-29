package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface PasswordResetTokenRepositoryR2DBC extends BaseR2DBCRepository<PasswordResetToken, String> {

    @Query("SELECT * FROM password_reset_token WHERE email = :email AND deleted_at IS NULL")
    Mono<PasswordResetToken> findByEmail(String email);

    @Query("SELECT * FROM password_reset_token WHERE token = :token AND deleted_at IS NULL")
    Mono<PasswordResetToken> findByToken(String token);
}
