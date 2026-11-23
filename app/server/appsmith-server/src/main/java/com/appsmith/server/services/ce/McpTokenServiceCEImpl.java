package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.McpToken;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.enums.McpKeyStatus;
import com.appsmith.server.enums.McpTokenStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.McpTokenCache;
import com.appsmith.server.helpers.McpTokenUtils;
import com.appsmith.server.helpers.McpUserKeyCodec;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.McpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.OrganizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.ORGANIZATION_ID;

@Slf4j
public class McpTokenServiceCEImpl implements McpTokenServiceCE {

    private static final int MAX_TOKEN_NAME_LENGTH = 50;
    private static final Set<Integer> ALLOWED_KEY_SPAN_DAYS = Set.of(30, 60, 90, 180, 365);

    private final OrganizationService organizationService;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final McpKeyRepository mcpKeyRepository;
    private final McpTokenRepository mcpTokenRepository;
    private final McpTokenCache mcpTokenCache;
    private final TransactionalOperator transactionalOperator;

    public McpTokenServiceCEImpl(
            OrganizationService organizationService,
            UserRepository userRepository,
            AnalyticsService analyticsService,
            McpKeyRepository mcpKeyRepository,
            McpTokenRepository mcpTokenRepository,
            McpTokenCache mcpTokenCache,
            TransactionalOperator transactionalOperator) {
        this.organizationService = organizationService;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
        this.mcpKeyRepository = mcpKeyRepository;
        this.mcpTokenRepository = mcpTokenRepository;
        this.mcpTokenCache = mcpTokenCache;
        this.transactionalOperator = transactionalOperator;
    }

    // CE: 2 live keys. EE overrides to 10.
    public int getMaxActiveKeysPerUser() {
        return 2;
    }

    @Override
    public Mono<McpTokenResponseDTO> create(User user, String name, Integer keySpanDays) {
        return validateKeySpanDays(keySpanDays).flatMap(validSpanDays -> resolveTokenName(name)
                .flatMap(resolvedName -> {
                    return validateMCPEnabled()
                            .then(inMongoTransaction(createKeyAndIssueToken(user, resolvedName, validSpanDays)));
                })
                .flatMap(issued -> putCachedToken(issued.token())
                        .then(sendAnalyticsEvent(user, issued.token(), name, validSpanDays))
                        .thenReturn(issued.response())));
    }

    private Mono<Void> validateMCPEnabled() {
        return organizationService
                .getCurrentUserOrganization()
                .flatMap(organization -> {
                    OrganizationConfiguration organizationConfiguration = organization.getOrganizationConfiguration();
                    // TODO: create error MCP is not enabled for this organization.
                    if (organizationConfiguration == null
                            || organizationConfiguration.getMcpConfig() == null
                            || !Boolean.TRUE.equals(
                                    organizationConfiguration.getMcpConfig().getEnabled())) {
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }

                    return Mono.just(organization);
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)))
                .then();
    }

    private Mono<IssuedToken> createKeyAndIssueToken(User user, String resolvedName, Integer validSpanDays) {
        return mcpKeyRepository.countByUserIdAndRevokedAtIsNull(user.getId()).flatMap(activeKeyCount -> {
            if (activeKeyCount >= getMaxActiveKeysPerUser()) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER, "maximum of " + getMaxActiveKeysPerUser() + " MCP keys"));
            }

            McpKey mcpKey = new McpKey();
            mcpKey.setUserId(user.getId());
            mcpKey.setName(resolvedName);
            mcpKey.setKeySpanDays(validSpanDays);

            return mcpKeyRepository.save(mcpKey).flatMap(savedKey -> issueToken(savedKey));
        });
    }

    private Mono<Void> sendAnalyticsEvent(User user, McpToken mcpToken, String name, Integer keySpanDays) {
        return analyticsService
                .sendEvent(
                        AnalyticsEvents.CREATE_MCP_TOKEN.getEventName(),
                        user.getUsername(),
                        Map.of(
                                "mcpKeyId", mcpToken.getMcpKeyId(),
                                "userId", user.getId(),
                                "keySpanDays", keySpanDays))
                .doOnError(throwable -> {
                    log.error("McpToken with name: {} for user: {} creation failed", name, user.getId(), throwable);
                })
                .onErrorComplete();
    }

    private Mono<String> resolveTokenName(String name) {
        if (!StringUtils.hasText(name)) {
            return Mono.just("Token created " + LocalDate.now(ZoneOffset.UTC));
        }

        String trimmed = name.replaceAll("[\\p{Cc}\\p{Cf}]", "").trim();
        if (!StringUtils.hasText(trimmed)) {
            return Mono.just("Token created " + LocalDate.now(ZoneOffset.UTC));
        }

        if (trimmed.length() > MAX_TOKEN_NAME_LENGTH) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER,
                    "MCP token name (must be at most " + MAX_TOKEN_NAME_LENGTH + " characters)"));
        }

        return Mono.just(trimmed);
    }

    /**
     * validates the key's ttl days, null defaults to 30.
     *
     * @param keySpanDays an Integer value for token's lifespan
     * @return A publisher of validated key ttl
     */
    private Mono<Integer> validateKeySpanDays(Integer keySpanDays) {
        if (keySpanDays == null) {
            return Mono.just(30);
        } else if (!ALLOWED_KEY_SPAN_DAYS.contains(keySpanDays)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER, "keySpanDays (must be one of 30, 60, 90, 180, 365)"));
        }
        return Mono.just(keySpanDays);
    }

    @Override
    public Flux<McpTokenResponseDTO> list(User user) {
        return mcpKeyRepository.findAllByUserId(user.getId()).collectList().flatMapMany(keys -> {
            if (keys.isEmpty()) {
                return Flux.empty();
            }

            List<String> keyIds = keys.stream().map(McpKey::getId).toList();
            return mcpTokenRepository
                    .findByMcpKeyIdInAndStatusIn(keyIds, List.of(McpTokenStatus.ACTIVE, McpTokenStatus.REVOKED))
                    .collect(Collectors.toMap(
                            McpToken::getMcpKeyId,
                            Function.identity(),
                            (left, right) -> left.getCreatedAt() != null
                                            && right.getCreatedAt() != null
                                            && left.getCreatedAt().isAfter(right.getCreatedAt())
                                    ? left
                                    : right))
                    .flatMapMany(tokenByKeyId ->
                            Flux.fromIterable(keys).map(key -> toResponse(key, tokenByKeyId.get(key.getId()), null)));
        });
    }

    @Override
    public Mono<McpTokenResponseDTO> rotate(User user, String keyId) {
        if (!StringUtils.hasText(keyId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "keyId"));
        }
        return mcpKeyRepository
                .findByIdAndUserIdAndRevokedAtIsNull(keyId, user.getId())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "MCP key", keyId)))
                .flatMap(key -> evictCachedToken(key.getId())
                        .then(inMongoTransaction(rotateInStore(key)))
                        .flatMap(issued -> putCachedToken(issued.token()).thenReturn(issued.response())));
    }

    /**
     * Retires the live credential and inserts its replacement in one Mongo transaction so callers never observe two
     * ACTIVE tokens for the same key. A key is supposed to have a single ACTIVE token; {@code updateBy} still matches
     * every ACTIVE row so a stray extra is flipped ROTATED rather than left beside the new insert.
     *
     * <p>The caller evicts Redis before this runs and puts the new entry after it commits, so the cache is never
     * part of the Mongo transaction and cannot keep serving the retired secret during the rotate.
     */
    private Mono<IssuedToken> rotateInStore(McpKey key) {
        Instant now = Instant.now();
        Update retireActive =
                new Update().set(McpToken.Fields.status, McpTokenStatus.ROTATED).set(McpToken.Fields.actedAt, now);
        return mcpTokenRepository
                .updateByMcpKeyIdAndStatus(key.getId(), McpTokenStatus.ACTIVE, retireActive)
                .then(issueToken(key));
    }

    private <T> Mono<T> inMongoTransaction(Mono<T> writer) {
        if (transactionalOperator == null) {
            return writer;
        }
        return writer.as(transactionalOperator::transactional);
    }

    @Override
    public Mono<Boolean> revoke(User user, String keyId) {
        if (!StringUtils.hasText(keyId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "keyId"));
        }
        Instant now = Instant.now();
        return mcpKeyRepository
                .findByIdAndUserIdAndRevokedAtIsNull(keyId, user.getId())
                .flatMap(key -> {
                    key.setRevokedAt(now);
                    return mcpKeyRepository
                            .save(key)
                            .then(mcpTokenRepository
                                    .findFirstByMcpKeyIdAndStatusOrderByCreatedAtDesc(
                                            key.getId(), McpTokenStatus.ACTIVE)
                                    .flatMap(token -> {
                                        token.setStatus(McpTokenStatus.REVOKED);
                                        token.setActedAt(now);
                                        return mcpTokenRepository.save(token);
                                    })
                                    .then(evictCachedToken(key.getId()))
                                    .thenReturn(true));
                })
                .defaultIfEmpty(false);
    }

    @Override
    public Mono<User> authenticate(String userKey) {
        if (!StringUtils.hasText(userKey)) {
            return Mono.empty();
        }

        String mcpKeyId = McpUserKeyCodec.expandKeyId(userKey);
        if (!StringUtils.hasText(mcpKeyId)) {
            logAuthFailure(AuthFailure.MALFORMED_TOKEN, null, userKey, null);
            return Mono.empty();
        }

        return authenticateFromCache(userKey, mcpKeyId)
                .switchIfEmpty(Mono.defer(() -> authenticateFromStore(userKey, mcpKeyId)))
                .flatMap(user -> requireMcpEnabled(user)
                        .doOnError(error -> logAuthFailure(AuthFailure.MCP_DISABLED, mcpKeyId, userKey, null)));
    }

    @Override
    public Mono<User> authenticateCached(String userKey) {
        if (!StringUtils.hasText(userKey)) {
            return Mono.empty();
        }

        String mcpKeyId = McpUserKeyCodec.expandKeyId(userKey);
        if (!StringUtils.hasText(mcpKeyId)) {
            return Mono.empty();
        }

        return authenticateFromCache(userKey, mcpKeyId).flatMap(this::requireMcpEnabled);
    }

    private Mono<User> requireMcpEnabled(User user) {
        return validateMCPEnabled()
                .thenReturn(user)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(
                        UsernamePasswordAuthenticationToken.authenticated(user, null, null)))
                .contextWrite(context -> context.put(ORGANIZATION_ID, user.getOrganizationId()));
    }

    private Mono<User> authenticateFromCache(String userKey, String mcpKeyId) {
        if (mcpTokenCache == null) {
            return Mono.empty();
        }
        return mcpTokenCache
                .get(mcpKeyId)
                .filter(entry -> McpTokenUtils.matches(userKey, entry.tokenHash()))
                .filter(entry -> isNotExpired(entry.expiresAt()))
                .flatMap(entry -> loadEnabledUser(entry.userId()));
    }

    /**
     * Accepts the presented key only when its key has an ACTIVE token with the same hash that has not expired, and
     * the token's owner is enabled. Every refusal writes one log line with the reason (see {@link #logAuthFailure}).
     */
    private Mono<User> authenticateFromStore(String userKey, String mcpKeyId) {
        return mcpTokenRepository
                .findByMcpKeyIdAndStatus(mcpKeyId, McpTokenStatus.ACTIVE)
                .collectList()
                .flatMap(activeTokens -> {
                    if (activeTokens.isEmpty()) {
                        logAuthFailure(AuthFailure.NO_ACTIVE_TOKEN, mcpKeyId, userKey, null);
                        return Mono.empty();
                    }

                    McpToken matched = activeTokens.stream()
                            .filter(storedToken -> McpTokenUtils.matches(userKey, storedToken.getTokenHash()))
                            .findFirst()
                            .orElse(null);
                    if (matched == null) {
                        logAuthFailure(AuthFailure.SECRET_MISMATCH, mcpKeyId, userKey, null);
                        return Mono.empty();
                    }

                    if (!isNotExpired(matched.getExpiresAt())) {
                        logAuthFailure(AuthFailure.EXPIRED, mcpKeyId, userKey, matched);
                        return Mono.empty();
                    }

                    return putCachedToken(matched)
                            .then(Mono.defer(() -> loadEnabledUser(matched.getUserId())))
                            .switchIfEmpty(Mono.fromRunnable(
                                    () -> logAuthFailure(AuthFailure.USER_DISABLED, mcpKeyId, userKey, matched)));
                });
    }

    /**
     * Why the store refused a presented MCP key. The reason is logged so an operator can tell, for example, an
     * expired key from a mistyped one. The HTTP answer stays the same for every reason.
     */
    private enum AuthFailure {
        // The value starts with neither a valid "mcp_<keyId>_" nor "mcp_<keyId>." prefix.
        MALFORMED_TOKEN,
        // The key has no ACTIVE token. The key is unknown, revoked, or its token was rotated away.
        NO_ACTIVE_TOKEN,
        // The key has an ACTIVE token, but the presented secret does not hash to it. For example, an old secret
        // after a rotate, or a token that was cut short or edited.
        SECRET_MISMATCH,
        // The secret matches, but the token's expiresAt has passed.
        EXPIRED,
        // The secret matches and is live, but the owner is missing or disabled.
        USER_DISABLED,
        // The key is valid, but the organization check failed. MCP is turned off for the organization, or the
        // organization could not be read. Logged only on a cache miss: when the token is cached, the fast path
        // (authenticateCached) fails first and this service never runs authenticate.
        MCP_DISABLED
    }

    // Length of the public key id prefix written to the log. The key id is public (the MCP keys page shows it), but
    // a prefix is enough to find the key and keeps the log from carrying the whole id.
    private static final int LOGGED_KEY_ID_PREFIX_LENGTH = 10;

    /**
     * Logs one refused MCP authentication. The line never holds the secret or the full key:
     * <ul>
     *   <li>keyIdPrefix: the first {@value #LOGGED_KEY_ID_PREFIX_LENGTH} characters of the public key id in lower
     *       case, or "invalid" when the value is malformed. The MCP service logs the same value in its
     *       appsmith_mcp_request event, so a search on keyIdPrefix finds both lines.</li>
     *   <li>presentedLength: the length of the presented value. A valid ObjectId key is 72 characters, so another
     *       length points to a value that was cut short or has extra characters.</li>
     *   <li>userId and expiresAt: only when a stored token was found.</li>
     * </ul>
     */
    private void logAuthFailure(AuthFailure reason, String mcpKeyId, String userKey, McpToken storedToken) {
        log.warn(
                "MCP token rejected: reason={}, keyIdPrefix={}, presentedLength={}, userId={}, expiresAt={}",
                reason,
                keyIdPrefix(mcpKeyId),
                userKey == null ? 0 : userKey.length(),
                storedToken == null ? "-" : storedToken.getUserId(),
                storedToken == null ? "-" : storedToken.getExpiresAt());
    }

    private static String keyIdPrefix(String mcpKeyId) {
        if (!StringUtils.hasText(mcpKeyId) || mcpKeyId.length() < LOGGED_KEY_ID_PREFIX_LENGTH) {
            return "invalid";
        }
        return mcpKeyId.substring(0, LOGGED_KEY_ID_PREFIX_LENGTH).toLowerCase(Locale.ROOT);
    }

    private Mono<User> loadEnabledUser(String userId) {
        return userRepository.findById(userId).filter(user -> Boolean.TRUE.equals(user.getIsEnabled()));
    }

    private Mono<IssuedToken> issueToken(McpKey key) {
        String secret = McpTokenUtils.generateSecret();
        String userKey = McpUserKeyCodec.compress(key.getId(), secret);
        Instant now = Instant.now();

        McpToken mcpToken = new McpToken();
        mcpToken.setUserId(key.getUserId());
        mcpToken.setMcpKeyId(key.getId());
        mcpToken.setTokenHash(McpTokenUtils.hash(userKey));
        mcpToken.setStatus(McpTokenStatus.ACTIVE);
        mcpToken.setExpiresAt(now.plus(Duration.ofDays(key.getKeySpanDays())));

        return mcpTokenRepository
                .save(mcpToken)
                .map(savedToken -> new IssuedToken(savedToken, toResponse(key, savedToken, userKey)));
    }

    private McpTokenResponseDTO toResponse(McpKey key, McpToken token, String userKey) {
        Instant expiresAt = token == null ? null : token.getExpiresAt();
        Instant createdAt = key.getCreatedAt();
        return new McpTokenResponseDTO(
                key.getId(), userKey, key.getName(), createdAt, expiresAt, resolveStatus(key, expiresAt));
    }

    /**
     * Key-level status for the admin list. Revocation wins over expiry so a revoked key that also ran out of
     * span still shows as {@link McpKeyStatus#REVOKED}. List currently omits revoked keys; this still encodes
     * REVOKED so a later list query can return them without another DTO change.
     */
    private static McpKeyStatus resolveStatus(McpKey key, Instant expiresAt) {
        if (key.getRevokedAt() != null) {
            return McpKeyStatus.REVOKED;
        }
        if (expiresAt == null || !expiresAt.isAfter(Instant.now())) {
            return McpKeyStatus.EXPIRED;
        }
        return McpKeyStatus.ACTIVE;
    }

    protected boolean isNotExpired(Instant expiresAt) {
        return expiresAt != null && expiresAt.isAfter(Instant.now());
    }

    private Mono<Void> putCachedToken(McpToken token) {
        if (mcpTokenCache == null) {
            return Mono.empty();
        }
        return mcpTokenCache.put(
                token.getMcpKeyId(),
                new McpTokenCache.Entry(token.getUserId(), token.getTokenHash(), token.getExpiresAt()));
    }

    private Mono<Void> evictCachedToken(String mcpKeyId) {
        if (mcpTokenCache == null) {
            return Mono.empty();
        }
        return mcpTokenCache.evict(mcpKeyId);
    }

    private record IssuedToken(McpToken token, McpTokenResponseDTO response) {}
}
