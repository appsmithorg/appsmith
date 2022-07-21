package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface PasswordResetTokenRepositoryCE extends BaseRepository<PasswordResetToken, String> {

    Mono<PasswordResetToken> findByEmail(String email);

}
