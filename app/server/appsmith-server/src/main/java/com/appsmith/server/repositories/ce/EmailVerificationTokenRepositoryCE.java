package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.EmailVerificationToken;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface EmailVerificationTokenRepositoryCE extends BaseRepository<EmailVerificationToken, String> {
    Mono<EmailVerificationToken> findByEmail(String email);
}
