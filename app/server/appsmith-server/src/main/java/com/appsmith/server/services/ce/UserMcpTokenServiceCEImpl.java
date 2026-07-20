package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserMcpToken;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserMcpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import org.springframework.beans.factory.annotation.Value;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

public class UserMcpTokenServiceCEImpl implements UserMcpTokenServiceCE {

    private static final String TOKEN_HASH_ALGORITHM = "SHA-256";
    private static final int MAX_ACTIVE_TOKENS_PER_USER = 10;
    private static final String TOKEN_PREFIX = "mcp_";
    // Upper bound on the user-facing token name; keeps the label list-friendly and bounds stored size.
    private static final int MAX_TOKEN_NAME_LENGTH = 50;
    // Admin-configurable via APPSMITH_MCP_TOKEN_TTL_DAYS. Bounded to a sane range so a misconfiguration can't mint
    // effectively-immortal or already-expired credentials.
    private static final long DEFAULT_TOKEN_TTL_DAYS = 90;
    private static final long MIN_TOKEN_TTL_DAYS = 1;
    private static final long MAX_TOKEN_TTL_DAYS = 3650;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserMcpTokenRepository userMcpTokenRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;

    // Instance field (not static) so the admin-configured lifetime applies. Setter-injected below; unit tests that
    // construct the service directly keep the default.
    private Duration tokenTtl = Duration.ofDays(DEFAULT_TOKEN_TTL_DAYS);

    public UserMcpTokenServiceCEImpl(
            UserMcpTokenRepository userMcpTokenRepository,
            UserRepository userRepository,
            AnalyticsService analyticsService) {
        this.userMcpTokenRepository = userMcpTokenRepository;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
    }

    @Value("${APPSMITH_MCP_TOKEN_TTL_DAYS:" + DEFAULT_TOKEN_TTL_DAYS + "}")
    public void setTokenTtlDays(long tokenTtlDays) {
        long bounded = Math.max(MIN_TOKEN_TTL_DAYS, Math.min(MAX_TOKEN_TTL_DAYS, tokenTtlDays));
        this.tokenTtl = Duration.ofDays(bounded);
    }

    @Override
    public Mono<McpTokenResponseDTO> create(User user, String name) {
        return resolveTokenName(name).flatMap(resolvedName -> userMcpTokenRepository
                .countByUserIdAndDeletedAtIsNull(user.getId())
                .flatMap(activeTokenCount -> {
                    if (activeTokenCount >= MAX_ACTIVE_TOKENS_PER_USER) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_PARAMETER,
                                "maximum of " + MAX_ACTIVE_TOKENS_PER_USER + " MCP tokens"));
                    }

                    String tokenId = UUID.randomUUID().toString();
                    String token = TOKEN_PREFIX + tokenId + "." + generateSecret();
                    UserMcpToken userMcpToken = new UserMcpToken();
                    userMcpToken.setTokenId(tokenId);
                    userMcpToken.setUserId(user.getId());
                    userMcpToken.setName(resolvedName);
                    userMcpToken.setTokenHash(hashToken(token));
                    userMcpToken.setExpiresAt(Instant.now().plus(tokenTtl));

                    return userMcpTokenRepository.save(userMcpToken).flatMap(savedToken -> {
                        McpTokenResponseDTO response = new McpTokenResponseDTO(
                                savedToken.getTokenId(),
                                token,
                                savedToken.getName(),
                                savedToken.getCreatedAt(),
                                savedToken.getExpiresAt());
                        // Adoption telemetry: emit only non-sensitive identifiers. The token secret/hash is never
                        // included so the raw credential can't leak through analytics. sendEvent is best-effort and
                        // must not fail token creation, mirroring how sibling services chain the analytics Mono.
                        Map<String, Object> analyticsProps = Map.of(
                                "tokenId", savedToken.getTokenId(),
                                "userId", user.getId(),
                                "ttlDays", tokenTtl.toDays());
                        return analyticsService
                                .sendEvent(
                                        AnalyticsEvents.CREATE_MCP_TOKEN.getEventName(),
                                        user.getUsername(),
                                        analyticsProps)
                                .thenReturn(response);
                    });
                }));
    }

    // Trims the requested name, defaults a blank/absent one to "Token created <date>", and rejects an over-long
    // one so the label stays list-friendly. Reactive so the rejection surfaces as a normal error signal.
    private Mono<String> resolveTokenName(String name) {
        // Strip control and invisible/format characters so a name is never a blank-looking label or a newline that
        // could break a future log/CSV line, then trim. An all-invisible name collapses to empty and gets defaulted.
        String trimmed =
                (name == null ? "" : name).replaceAll("[\\p{Cc}\\p{Cf}]", "").trim();

        if (trimmed.isEmpty()) {
            return Mono.just("Token created " + LocalDate.now(ZoneOffset.UTC));
        }

        if (trimmed.length() > MAX_TOKEN_NAME_LENGTH) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER,
                    "MCP token name (must be at most " + MAX_TOKEN_NAME_LENGTH + " characters)"));
        }

        return Mono.just(trimmed);
    }

    @Override
    public Flux<McpTokenResponseDTO> list(User user) {
        return userMcpTokenRepository
                .findAllByUserIdAndDeletedAtIsNull(user.getId())
                .map(token -> new McpTokenResponseDTO(
                        token.getTokenId(), null, token.getName(), token.getCreatedAt(), token.getExpiresAt()));
    }

    @Override
    public Mono<McpTokenResponseDTO> rotate(User user, String tokenId) {
        return userMcpTokenRepository
                .findByTokenIdAndUserIdAndDeletedAtIsNull(tokenId, user.getId())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "MCP token", tokenId)))
                .flatMap(existingToken -> {
                    String token = TOKEN_PREFIX + existingToken.getTokenId() + "." + generateSecret();
                    existingToken.setTokenHash(hashToken(token));
                    existingToken.setExpiresAt(Instant.now().plus(tokenTtl));

                    return userMcpTokenRepository
                            .save(existingToken)
                            .map(savedToken -> new McpTokenResponseDTO(
                                    savedToken.getTokenId(),
                                    token,
                                    savedToken.getName(),
                                    savedToken.getCreatedAt(),
                                    savedToken.getExpiresAt()));
                });
    }

    @Override
    public Mono<Boolean> revoke(User user, String tokenId) {
        return userMcpTokenRepository
                .findByTokenIdAndUserIdAndDeletedAtIsNull(tokenId, user.getId())
                .flatMap(token -> userMcpTokenRepository.archiveById(token.getId()))
                .defaultIfEmpty(false);
    }

    @Override
    public Mono<User> authenticate(String token) {
        String tokenId = extractTokenId(token);
        if (tokenId == null) {
            return Mono.empty();
        }

        return userMcpTokenRepository
                .findByTokenIdAndDeletedAtIsNull(tokenId)
                .filter(storedToken -> matchesStoredHash(token, storedToken.getTokenHash()))
                .filter(UserMcpTokenServiceCEImpl::isNotExpired)
                .flatMap(storedToken -> userRepository.findById(storedToken.getUserId()))
                .filter(user -> Boolean.TRUE.equals(user.getIsEnabled()));
    }

    private String generateSecret() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(MessageDigest.getInstance(TOKEN_HASH_ALGORITHM)
                            .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 must be available", exception);
        }
    }

    /**
     * MCP tokens carry a 256-bit random secret, so brute force is infeasible and a key-stretching hash (BCrypt) is
     * both redundant and a CPU-exhaustion DoS vector on every authenticated request. Compare the stored SHA-256 hash
     * with a constant-time equality check instead.
     */
    private boolean matchesStoredHash(String token, String storedHash) {
        if (storedHash == null) {
            return false;
        }
        return MessageDigest.isEqual(
                hashToken(token).getBytes(StandardCharsets.UTF_8), storedHash.getBytes(StandardCharsets.UTF_8));
    }

    private static boolean isNotExpired(UserMcpToken storedToken) {
        // Fail closed: a token with no expiry is rejected. Every token minted here carries one, so a missing
        // expiry means a malformed/foreign record that must not authenticate.
        return storedToken.getExpiresAt() != null && storedToken.getExpiresAt().isAfter(Instant.now());
    }

    private String extractTokenId(String token) {
        if (token == null || !token.startsWith(TOKEN_PREFIX)) {
            return null;
        }

        int separatorIndex = token.indexOf('.', TOKEN_PREFIX.length());
        if (separatorIndex == -1) {
            return null;
        }

        try {
            return UUID.fromString(token.substring(TOKEN_PREFIX.length(), separatorIndex))
                    .toString();
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
