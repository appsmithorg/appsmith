package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserMcpToken;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserMcpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

public class UserMcpTokenServiceCEImpl implements UserMcpTokenServiceCE {

    private static final String TOKEN_HASH_ALGORITHM = "SHA-256";
    private static final int MAX_ACTIVE_TOKENS_PER_USER = 10;
    private static final String TOKEN_PREFIX = "mcp_";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserMcpTokenRepository userMcpTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserMcpTokenServiceCEImpl(
            UserMcpTokenRepository userMcpTokenRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userMcpTokenRepository = userMcpTokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Mono<McpTokenResponseDTO> create(User user) {
        return userMcpTokenRepository
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
                    userMcpToken.setTokenHash(passwordEncoder.encode(hashToken(token)));

                    return userMcpTokenRepository
                            .save(userMcpToken)
                            .map(savedToken ->
                                    new McpTokenResponseDTO(savedToken.getTokenId(), token, savedToken.getCreatedAt()));
                });
    }

    @Override
    public Flux<McpTokenResponseDTO> list(User user) {
        return userMcpTokenRepository
                .findAllByUserIdAndDeletedAtIsNull(user.getId())
                .map(token -> new McpTokenResponseDTO(token.getTokenId(), null, token.getCreatedAt()));
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
                .filter(storedToken -> passwordEncoder.matches(hashToken(token), storedToken.getTokenHash()))
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

    private String extractTokenId(String token) {
        if (!token.startsWith(TOKEN_PREFIX)) {
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
