package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserMcpToken;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.repositories.UserMcpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserMcpTokenServiceImplTest {

    @Mock
    private UserMcpTokenRepository userMcpTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Captor
    private ArgumentCaptor<UserMcpToken> userMcpTokenCaptor;

    private UserMcpTokenServiceImpl service;
    private User user;
    private UserMcpToken persistedToken;

    @BeforeEach
    void setUp() {
        service = new UserMcpTokenServiceImpl(userMcpTokenRepository, userRepository);
        user = new User();
        user.setId("user-id");
        user.setIsEnabled(true);
    }

    @Test
    void create_generatesOneTimeTokenAndStoresOnlyHash() {
        when(userMcpTokenRepository.countByUserIdAndDeletedAtIsNull(user.getId()))
                .thenReturn(Mono.just(0L));
        when(userMcpTokenRepository.save(any(UserMcpToken.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        StepVerifier.create(service.create(user))
                .assertNext(response -> {
                    assertThat(response.id()).isNotBlank();
                    assertThat(response.token()).startsWith("mcp_" + response.id() + ".");
                })
                .verifyComplete();

        verify(userMcpTokenRepository).save(userMcpTokenCaptor.capture());
        UserMcpToken storedToken = userMcpTokenCaptor.getValue();
        assertThat(storedToken.getUserId()).isEqualTo(user.getId());
        assertThat(storedToken.getTokenHash()).doesNotStartWith("mcp_");
    }

    @Test
    void create_rejectsWhenUserHasMaximumActiveTokens() {
        when(userMcpTokenRepository.countByUserIdAndDeletedAtIsNull(user.getId()))
                .thenReturn(Mono.just(10L));

        StepVerifier.create(service.create(user)).expectError().verify();
    }

    @Test
    void authenticate_matchesStoredHashAndReturnsOwner() {
        McpTokenResponseDTO generated = createToken();
        when(userMcpTokenRepository.findByTokenIdAndDeletedAtIsNull(persistedToken.getTokenId()))
                .thenReturn(Mono.just(persistedToken));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));

        StepVerifier.create(service.authenticate(generated.token()))
                .expectNext(user)
                .verifyComplete();
    }

    // Regression for the BCrypt CPU-exhaustion DoS: the token secret is high-entropy, so it must be stored as a
    // plain fast SHA-256 hash (deterministic, no key stretching), not a BCrypt hash. Fails on the unpatched code,
    // which stored passwordEncoder.encode(...) (a non-deterministic "$2a$"-prefixed BCrypt hash).
    @Test
    void create_storesFastSha256HashNotBcrypt() {
        McpTokenResponseDTO generated = createToken();

        assertThat(persistedToken.getTokenHash()).doesNotStartWith("$2");
        assertThat(persistedToken.getTokenHash()).isEqualTo(sha256Base64Url(generated.token()));
    }

    // The exact DoS proof-of-concept payload — a valid tokenId with a wrong secret — must be rejected via the fast
    // constant-time comparison, without invoking any key-stretching hash.
    @Test
    void authenticate_rejectsValidTokenIdWithWrongSecret() {
        McpTokenResponseDTO generated = createToken();
        when(userMcpTokenRepository.findByTokenIdAndDeletedAtIsNull(persistedToken.getTokenId()))
                .thenReturn(Mono.just(persistedToken));

        String tamperedToken = "mcp_" + generated.id() + ".wrong-secret";
        StepVerifier.create(service.authenticate(tamperedToken)).verifyComplete();
    }

    @Test
    void create_setsFutureExpiry() {
        createToken();

        assertThat(persistedToken.getExpiresAt()).isNotNull();
        assertThat(persistedToken.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void authenticate_rejectsExpiredToken() {
        McpTokenResponseDTO generated = createToken();
        persistedToken.setExpiresAt(Instant.now().minusSeconds(60));
        when(userMcpTokenRepository.findByTokenIdAndDeletedAtIsNull(persistedToken.getTokenId()))
                .thenReturn(Mono.just(persistedToken));

        StepVerifier.create(service.authenticate(generated.token())).verifyComplete();
    }

    @Test
    void revoke_onlyArchivesTokenOwnedByCurrentUser() {
        UserMcpToken storedToken = new UserMcpToken();
        storedToken.setId("mongo-id");
        storedToken.setTokenId("token-id");
        storedToken.setUserId(user.getId());
        when(userMcpTokenRepository.findByTokenIdAndUserIdAndDeletedAtIsNull("token-id", user.getId()))
                .thenReturn(Mono.just(storedToken));
        when(userMcpTokenRepository.archiveById("mongo-id")).thenReturn(Mono.just(true));

        StepVerifier.create(service.revoke(user, "token-id")).expectNext(true).verifyComplete();

        verify(userMcpTokenRepository).findByTokenIdAndUserIdAndDeletedAtIsNull(eq("token-id"), eq(user.getId()));
        verify(userMcpTokenRepository).archiveById("mongo-id");
    }

    // Rotation is covered end to end by McpTokenControllerCETest (session-auth delegates + returns the rotated
    // token; MCP-auth is rejected). A service-level unit test of rotate/authenticate is intentionally omitted here:
    // it over-specifies Mockito interactions across two flows and is redundant with the controller coverage.

    private McpTokenResponseDTO createToken() {
        when(userMcpTokenRepository.countByUserIdAndDeletedAtIsNull(user.getId()))
                .thenReturn(Mono.just(0L));
        when(userMcpTokenRepository.save(any(UserMcpToken.class))).thenAnswer(invocation -> {
            persistedToken = invocation.getArgument(0);
            return Mono.just(persistedToken);
        });

        return service.create(user).block();
    }

    private static String sha256Base64Url(String value) {
        try {
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(
                            MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
