package com.appsmith.server.repositories;

import com.appsmith.server.domains.PasswordResetToken;
import reactor.core.publisher.Mono;

public interface PasswordResetTokenRepository extends BaseRepository<PasswordResetToken, String> {
    Mono<PasswordResetToken> findByEmail(String email);
}
