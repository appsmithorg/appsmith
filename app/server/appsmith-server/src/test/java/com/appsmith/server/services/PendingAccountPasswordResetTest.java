package com.appsmith.server.services;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.WWWFormCodec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * The password reset link is how a person who was invited sets a password and activates the account. A
 * system-generated account gets no reset link and a reset link does not activate it.
 */
@SpringBootTest
class PendingAccountPasswordResetTest {

    private static final String BASE_URL = "http://localhost:8080";
    private static final String NEW_PASSWORD = "Reset-Password-1234";

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @SpyBean
    private EmailService emailService;

    private final List<User> savedAccounts = new ArrayList<>();

    @AfterEach
    void tearDown() {
        savedAccounts.forEach(user -> {
            passwordResetTokenRepository
                    .findByEmailAndOrganizationId(user.getEmail(), user.getOrganizationId())
                    .flatMap(passwordResetTokenRepository::delete)
                    .block();
            userRepository.deleteById(user.getId()).block();
        });
        savedAccounts.clear();
    }

    @Test
    void should_activateAccount_when_resetTokenIsPresentedForPendingAccount() {
        // Given
        User pending = savePendingAccount(false);
        String encryptedToken = issueResetToken(pending);

        // When
        User passwordHolder = new User();
        passwordHolder.setPassword(NEW_PASSWORD);

        // Then
        StepVerifier.create(userService.resetPasswordAfterForgotPassword(encryptedToken, passwordHolder))
                .expectNext(true)
                .verifyComplete();

        User afterReset = userRepository.findById(pending.getId()).block();
        assertThat(afterReset).isNotNull();
        assertThat(afterReset.getIsEnabled()).isTrue();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, afterReset.getPassword()))
                .isTrue();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_refuseReset_when_accountIsSystemGenerated() {
        // Given
        User systemAccount = savePendingAccount(true);
        String encryptedToken = issueResetToken(systemAccount);

        // When
        User passwordHolder = new User();
        passwordHolder.setPassword(NEW_PASSWORD);

        // Then
        StepVerifier.create(userService.resetPasswordAfterForgotPassword(encryptedToken, passwordHolder))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INVALID_PASSWORD_RESET);
                    assertThat(error).hasMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage());
                })
                .verify();

        User afterReset = userRepository.findById(systemAccount.getId()).block();
        assertThat(afterReset).isNotNull();
        assertThat(afterReset.getIsEnabled()).isFalse();
        assertThat(afterReset.getPassword()).isNull();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_sendNoResetLink_when_accountIsSystemGenerated() {
        // Given
        User systemAccount = savePendingAccount(true);
        ResetUserPasswordDTO request = new ResetUserPasswordDTO();
        request.setEmail(systemAccount.getEmail());
        request.setBaseUrl(BASE_URL);
        Mockito.clearInvocations(emailService);

        // When
        StepVerifier.create(userService.forgotPasswordTokenGenerate(request))
                .expectNext(true)
                .verifyComplete();

        // Then
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(any(), any(), any());
        assertThat(passwordResetTokenRepository
                        .findByEmailAndOrganizationId(systemAccount.getEmail(), systemAccount.getOrganizationId())
                        .block())
                .isNull();
    }

    private User savePendingAccount(boolean systemGenerated) {
        String organizationId =
                organizationService.getCurrentUserOrganizationId().block();
        User user = new User();
        user.setEmail("pending-" + UUID.randomUUID() + "@example.com");
        user.setIsEnabled(false);
        user.setIsSystemGenerated(systemGenerated);
        user.setOrganizationId(organizationId);
        User saved = userRepository.save(user).block();
        savedAccounts.add(saved);
        return saved;
    }

    private String issueResetToken(User user) {
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setEmail(user.getEmail());
        resetToken.setOrganizationId(user.getOrganizationId());
        resetToken.setRequestCount(1);
        resetToken.setFirstRequestTime(Instant.now());
        resetToken.setTokenHash(passwordEncoder.encode(token));
        passwordResetTokenRepository.save(resetToken).block();

        List<NameValuePair> params =
                List.of(new BasicNameValuePair("email", user.getEmail()), new BasicNameValuePair("token", token));
        return EncryptionHelper.encrypt(WWWFormCodec.format(params, StandardCharsets.UTF_8));
    }
}
