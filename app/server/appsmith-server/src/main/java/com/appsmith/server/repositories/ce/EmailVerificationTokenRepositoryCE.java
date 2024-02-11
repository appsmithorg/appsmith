package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.EmailVerificationToken;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepositoryCE
        extends BaseRepository<EmailVerificationToken, String>, AppsmithRepository<EmailVerificationToken> {
    Optional<EmailVerificationToken> findByEmail(String email);
}
