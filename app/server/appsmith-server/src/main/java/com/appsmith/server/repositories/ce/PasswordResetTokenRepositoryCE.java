package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;

import java.util.Optional;

public interface PasswordResetTokenRepositoryCE
        extends BaseRepository<PasswordResetToken, String>, AppsmithRepository<PasswordResetToken> {

    Optional<PasswordResetToken> findByEmail(String email);
}
