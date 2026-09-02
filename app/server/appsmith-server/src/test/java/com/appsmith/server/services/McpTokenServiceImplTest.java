package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.McpToken;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.enums.McpKeyStatus;
import com.appsmith.server.enums.McpTokenStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.McpTokenCache;
import com.appsmith.server.helpers.McpTokenUtils;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.McpTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link McpTokenServiceImpl}. Create and rotate wrap Mongo writes in
 * {@link TransactionalOperator}; cache put/evict stay outside that transaction.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class McpTokenServiceImplTest {

    @Mock
    OrganizationService organizationService;

    @Mock
    private McpKeyRepository mcpKeyRepository;

    @Mock
    private McpTokenRepository mcpTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private McpTokenCache mcpTokenCache;

    @Mock
    private TransactionalOperator transactionalOperator;

    @Captor
    private ArgumentCaptor<McpKey> mcpKeyCaptor;

    @Captor
    private ArgumentCaptor<McpToken> mcpTokenCaptor;

    @Captor
    private ArgumentCaptor<Map<String, Object>> analyticsPropsCaptor;

    private McpTokenServiceImpl service;
    private User user;
    private McpKey persistedKey;
    private McpToken persistedToken;

    private static final Organization organization = new Organization();
    private static final OrganizationConfiguration organizationConfiguration = new OrganizationConfiguration();
    private static final McpConfig mcpConfig = new McpConfig();

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mcpConfig.setEnabled(true);
        organizationConfiguration.setMcpConfig(mcpConfig);
        organization.setOrganizationConfiguration(organizationConfiguration);

        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(organization));
        when(transactionalOperator.transactional(any(Mono.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mcpTokenCache.put(anyString(), any())).thenReturn(Mono.empty());
        when(mcpTokenCache.evict(anyString())).thenReturn(Mono.empty());
        when(mcpTokenCache.get(anyString())).thenReturn(Mono.empty());
        when(analyticsService.sendEvent(anyString(), anyString(), anyMap())).thenReturn(Mono.empty());

        service = new McpTokenServiceImpl(
                organizationService,
                userRepository,
                analyticsService,
                mcpKeyRepository,
                mcpTokenRepository,
                mcpTokenCache,
                transactionalOperator);

        user = new User();
        user.setId("user-id");
        user.setEmail("actor@example.com");
        user.setOrganizationId("orgId");
        user.setIsEnabled(true);
    }

    @Test
    void should_returnPresentedKeyAndStoreOnlyHash_whenCreateSucceeds() {
        stubCreatePersistence();

        StepVerifier.create(service.create(user, "Claude Desktop", 90))
                .assertNext(response -> {
                    assertThat(response.id()).isEqualTo(persistedKey.getId());
                    assertThat(response.token()).startsWith("mcp_" + response.id() + "_");
                    assertThat(response.name()).isEqualTo("Claude Desktop");
                    assertThat(response.status()).isEqualTo(McpKeyStatus.ACTIVE);
                })
                .verifyComplete();

        verify(mcpTokenRepository).save(mcpTokenCaptor.capture());
        McpToken stored = mcpTokenCaptor.getValue();
        assertThat(stored.getTokenHash()).doesNotStartWith("mcp_");
        assertThat(stored.getStatus()).isEqualTo(McpTokenStatus.ACTIVE);
        assertThat(stored.getMcpKeyId()).isEqualTo(persistedKey.getId());
    }

    @Test
    void should_runCreateInsideMongoTransaction_whenCreateSucceeds() {
        stubCreatePersistence();

        service.create(user, null, 30).block();

        verify(transactionalOperator).transactional(any(Mono.class));
        verify(mcpTokenCache).put(eq(persistedKey.getId()), any(McpTokenCache.Entry.class));
    }

    @Test
    void should_storeSha256HashNotBcrypt_whenCreateSucceeds() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);

        assertThat(persistedToken.getTokenHash()).doesNotStartWith("$2");
        assertThat(persistedToken.getTokenHash()).isEqualTo(McpTokenUtils.hash(generated.token()));
    }

    @Test
    void should_setExpiryFromKeySpanDays_whenCreateSucceeds() {
        createToken("Claude Desktop", 90);

        assertThat(persistedToken.getExpiresAt())
                .isAfter(Instant.now().plus(Duration.ofDays(89)))
                .isBefore(Instant.now().plus(Duration.ofDays(91)));
        assertThat(persistedKey.getKeySpanDays()).isEqualTo(90);
    }

    @Test
    void should_defaultKeySpanDaysTo30_whenKeySpanDaysIsNull() {
        createToken("Claude Desktop", null);

        assertThat(persistedKey.getKeySpanDays()).isEqualTo(30);
        assertThat(persistedToken.getExpiresAt())
                .isAfter(Instant.now().plus(Duration.ofDays(29)))
                .isBefore(Instant.now().plus(Duration.ofDays(31)));
    }

    @Test
    void should_rejectCreate_whenKeySpanDaysIsNotAllowed() {
        StepVerifier.create(service.create(user, "Claude Desktop", 7))
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessageContaining("keySpanDays"))
                .verify();

        verify(transactionalOperator, never()).transactional(any(Mono.class));
        verify(mcpKeyRepository, never()).save(any());
    }

    @Test
    void should_rejectCreate_whenUserAlreadyHasTenLiveKeys() {
        when(mcpKeyRepository.countByUserIdAndRevokedAtIsNull(user.getId())).thenReturn(Mono.just(10L));

        StepVerifier.create(service.create(user, "Claude Desktop", 30))
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessageContaining("maximum of 10"))
                .verify();
    }

    @Test
    void should_storeAndReturnProvidedName_whenNameIsPresent() {
        assertThat(createToken("Claude Desktop", 30).name()).isEqualTo("Claude Desktop");
        assertThat(persistedKey.getName()).isEqualTo("Claude Desktop");
    }

    @Test
    void should_trimProvidedName_whenNameHasWhitespace() {
        createToken("  CI pipeline  ", 30);
        assertThat(persistedKey.getName()).isEqualTo("CI pipeline");
    }

    @Test
    void should_defaultNameToTokenCreatedDate_whenNameIsBlank() {
        assertThat(createToken(null, 30).name()).startsWith("Token created ");
        assertThat(createToken("   ", 30).name()).startsWith("Token created ");
    }

    @Test
    void should_acceptName_whenLengthIsFifty() {
        String maxName = "x".repeat(50);
        assertThat(createToken(maxName, 30).name()).isEqualTo(maxName);
    }

    @Test
    void should_rejectCreate_whenNameExceedsFiftyCharacters() {
        StepVerifier.create(service.create(user, "x".repeat(51), 30))
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessageContaining("at most"))
                .verify();

        verify(transactionalOperator, never()).transactional(any(Mono.class));
    }

    @Test
    void should_stripControlCharsThenDefaultName_whenNameIsOnlyInvisible() {
        assertThat(createToken("Claude\nDesktop", 30).name()).isEqualTo("ClaudeDesktop");
        assertThat(createToken("\u200B\u200B", 30).name()).startsWith("Token created ");
    }

    @Test
    void should_emitCreateAnalyticsWithoutSecret_whenCreateSucceeds() {
        McpTokenResponseDTO response = createToken("Claude Desktop", 90);

        verify(analyticsService)
                .sendEvent(
                        eq(AnalyticsEvents.CREATE_MCP_TOKEN.getEventName()),
                        eq(user.getUsername()),
                        analyticsPropsCaptor.capture());

        Map<String, Object> props = analyticsPropsCaptor.getValue();
        assertThat(props).containsOnlyKeys("mcpKeyId", "userId", "keySpanDays");
        assertThat(props).containsEntry("mcpKeyId", response.id());
        assertThat(props).containsEntry("userId", user.getId());
        assertThat(props).containsEntry("keySpanDays", 90);
        assertThat(props.values()).doesNotContain(response.token());
        assertThat(props.values().stream().map(String::valueOf)).noneMatch(value -> value.startsWith("mcp_"));
    }

    @Test
    void should_returnLiveKeysWithoutSecrets_whenListSucceeds() {
        McpKey key = liveKey("key-1", "Claude Desktop");
        McpToken token = activeToken(key);
        when(mcpKeyRepository.findAllByUserId(user.getId())).thenReturn(Flux.just(key));
        when(mcpTokenRepository.findByMcpKeyIdInAndStatusIn(
                        any(), eq(List.of(McpTokenStatus.ACTIVE, McpTokenStatus.REVOKED))))
                .thenReturn(Flux.just(token));

        StepVerifier.create(service.list(user))
                .assertNext(dto -> {
                    assertThat(dto.id()).isEqualTo("key-1");
                    assertThat(dto.name()).isEqualTo("Claude Desktop");
                    assertThat(dto.token()).isNull();
                    assertThat(dto.expiresAt()).isEqualTo(token.getExpiresAt());
                    assertThat(dto.status()).isEqualTo(McpKeyStatus.ACTIVE);
                })
                .verifyComplete();
    }

    @Test
    void should_returnExpiredStatus_whenListedKeyHasPastExpiresAt() {
        McpKey key = liveKey("key-1", "Claude Desktop");
        McpToken token = activeToken(key);
        token.setExpiresAt(Instant.now().minusSeconds(60));
        when(mcpKeyRepository.findAllByUserId(user.getId())).thenReturn(Flux.just(key));
        when(mcpTokenRepository.findByMcpKeyIdInAndStatusIn(
                        any(), eq(List.of(McpTokenStatus.ACTIVE, McpTokenStatus.REVOKED))))
                .thenReturn(Flux.just(token));

        StepVerifier.create(service.list(user))
                .assertNext(dto -> assertThat(dto.status()).isEqualTo(McpKeyStatus.EXPIRED))
                .verifyComplete();
    }

    @Test
    void should_returnRevokedStatus_whenKeyHasRevokedAtEvenIfAlsoExpired() {
        McpKey key = liveKey("key-1", "Claude Desktop");
        key.setRevokedAt(Instant.now());
        McpToken token = activeToken(key);
        token.setExpiresAt(Instant.now().minusSeconds(60));
        when(mcpKeyRepository.findAllByUserId(user.getId())).thenReturn(Flux.just(key));
        when(mcpTokenRepository.findByMcpKeyIdInAndStatusIn(
                        any(), eq(List.of(McpTokenStatus.ACTIVE, McpTokenStatus.REVOKED))))
                .thenReturn(Flux.just(token));

        StepVerifier.create(service.list(user))
                .assertNext(dto -> assertThat(dto.status()).isEqualTo(McpKeyStatus.REVOKED))
                .verifyComplete();
    }

    @Test
    void should_completeEmpty_whenUserHasNoLiveKeys() {
        when(mcpKeyRepository.findAllByUserId(user.getId())).thenReturn(Flux.empty());

        StepVerifier.create(service.list(user)).verifyComplete();
        verify(mcpTokenRepository, never()).findByMcpKeyIdInAndStatusIn(any(), anyList());
    }

    @Test
    void should_rejectRotate_whenKeyIdIsBlank() {
        StepVerifier.create(service.rotate(user, "  "))
                .expectError(AppsmithException.class)
                .verify();

        verify(transactionalOperator, never()).transactional(any(Mono.class));
        verify(mcpTokenCache, never()).evict(anyString());
    }

    @Test
    void should_errorNotFound_whenRotatingMissingOrRevokedKey() {
        when(mcpKeyRepository.findByIdAndUserIdAndRevokedAtIsNull("missing", user.getId()))
                .thenReturn(Mono.empty());

        StepVerifier.create(service.rotate(user, "missing"))
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessageContaining("MCP key"))
                .verify();

        verify(transactionalOperator, never()).transactional(any(Mono.class));
    }

    @Test
    void should_evictCacheThenOpenTransactionThenPutCache_whenRotateSucceeds() {
        McpKey key = liveKey(new ObjectId().toString(), "CI pipeline");
        stubRotatePersistence(key);

        McpTokenResponseDTO rotated = service.rotate(user, key.getId()).block();

        assertThat(rotated).isNotNull();
        assertThat(rotated.id()).isEqualTo(key.getId());
        assertThat(rotated.name()).isEqualTo("CI pipeline");
        assertThat(rotated.token()).startsWith("mcp_" + key.getId() + "_");
        assertThat(rotated.status()).isEqualTo(McpKeyStatus.ACTIVE);

        InOrder inOrder = inOrder(mcpTokenCache, transactionalOperator);
        inOrder.verify(mcpTokenCache).evict(key.getId());
        inOrder.verify(transactionalOperator).transactional(any(Mono.class));
        inOrder.verify(mcpTokenCache).put(eq(key.getId()), any(McpTokenCache.Entry.class));

        verify(mcpTokenRepository)
                .updateByMcpKeyIdAndStatus(eq(key.getId()), eq(McpTokenStatus.ACTIVE), any(Update.class));
        verify(mcpTokenRepository).save(mcpTokenCaptor.capture());
        assertThat(mcpTokenCaptor.getValue().getStatus()).isEqualTo(McpTokenStatus.ACTIVE);
    }

    @Test
    void should_rejectOldSecretAndAcceptNewSecret_whenAuthenticateAfterRotate() {
        McpTokenResponseDTO original = createToken("CI pipeline", 30);
        String originalSecret = original.token();
        stubRotatePersistence(persistedKey);

        McpTokenResponseDTO rotated = service.rotate(user, persistedKey.getId()).block();
        when(mcpTokenRepository.findByMcpKeyIdAndStatus(persistedKey.getId(), McpTokenStatus.ACTIVE))
                .thenReturn(Flux.just(persistedToken));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));

        StepVerifier.create(service.authenticate(originalSecret)).verifyComplete();
        StepVerifier.create(service.authenticate(rotated.token()))
                .expectNext(user)
                .verifyComplete();
    }

    @Test
    void should_rejectRevoke_whenKeyIdIsBlank() {
        StepVerifier.create(service.revoke(user, ""))
                .expectError(AppsmithException.class)
                .verify();
        verify(transactionalOperator, never()).transactional(any(Mono.class));
    }

    @Test
    void should_returnFalse_whenRevokingMissingOrForeignKey() {
        when(mcpKeyRepository.findByIdAndUserIdAndRevokedAtIsNull("missing", user.getId()))
                .thenReturn(Mono.empty());

        StepVerifier.create(service.revoke(user, "missing")).expectNext(false).verifyComplete();
        verify(transactionalOperator, never()).transactional(any(Mono.class));
        verify(mcpTokenCache, never()).evict(anyString());
    }

    @Test
    void should_setKeyRevokedAtAndTokenRevoked_whenRevokeSucceeds() {
        McpKey key = liveKey("key-1", "Claude Desktop");
        McpToken token = activeToken(key);
        when(mcpKeyRepository.findByIdAndUserIdAndRevokedAtIsNull("key-1", user.getId()))
                .thenReturn(Mono.just(key));
        when(mcpKeyRepository.save(any(McpKey.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(mcpTokenRepository.findFirstByMcpKeyIdAndStatusOrderByCreatedAtDesc("key-1", McpTokenStatus.ACTIVE))
                .thenReturn(Mono.just(token));
        when(mcpTokenRepository.save(any(McpToken.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        StepVerifier.create(service.revoke(user, "key-1")).expectNext(true).verifyComplete();

        verify(mcpKeyRepository).save(mcpKeyCaptor.capture());
        assertThat(mcpKeyCaptor.getValue().getRevokedAt()).isNotNull();
        verify(mcpTokenRepository).save(mcpTokenCaptor.capture());
        assertThat(mcpTokenCaptor.getValue().getStatus()).isEqualTo(McpTokenStatus.REVOKED);
        assertThat(mcpTokenCaptor.getValue().getActedAt()).isNotNull();
        verify(mcpTokenCache).evict("key-1");
        verify(transactionalOperator, never()).transactional(any(Mono.class));
    }

    @Test
    void should_completeEmpty_whenUserKeyIsBlankOrMalformed() {
        StepVerifier.create(service.authenticate(null)).verifyComplete();
        StepVerifier.create(service.authenticate("")).verifyComplete();
        StepVerifier.create(service.authenticate("not-an-mcp-key")).verifyComplete();
        verify(mcpTokenRepository, never()).findByMcpKeyIdAndStatus(anyString(), any());
    }

    @Test
    void should_returnOwner_whenCacheHashMatchesAndUserIsEnabled() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        when(mcpTokenCache.get(generated.id()))
                .thenReturn(Mono.just(new McpTokenCache.Entry(
                        user.getId(), persistedToken.getTokenHash(), persistedToken.getExpiresAt())));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));

        StepVerifier.create(service.authenticate(generated.token()))
                .expectNext(user)
                .verifyComplete();

        verify(mcpTokenRepository, never()).findByMcpKeyIdAndStatus(anyString(), any());
    }

    @Test
    void should_throwError_whenMCPDisabledCacheHashMatchesAndUserIsEnabled() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        when(mcpTokenCache.get(generated.id()))
                .thenReturn(Mono.just(new McpTokenCache.Entry(
                        user.getId(), persistedToken.getTokenHash(), persistedToken.getExpiresAt())));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));
        mcpConfig.setEnabled(false);
        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(organization));

        StepVerifier.create(service.authenticate(generated.token())).expectErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getError().getAppErrorCode())
                    .isEqualTo(AppsmithError.INTERNAL_SERVER_ERROR.getAppErrorCode());
        });

        verify(mcpTokenRepository, never()).findByMcpKeyIdAndStatus(anyString(), any());
    }

    @Test
    void should_fallBackToStoreAndRefillCache_whenCacheMisses() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        when(mcpTokenCache.get(generated.id())).thenReturn(Mono.empty());
        when(mcpTokenRepository.findByMcpKeyIdAndStatus(generated.id(), McpTokenStatus.ACTIVE))
                .thenReturn(Flux.just(persistedToken));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));

        StepVerifier.create(service.authenticate(generated.token()))
                .expectNext(user)
                .verifyComplete();

        verify(mcpTokenCache, times(2)).put(eq(generated.id()), any(McpTokenCache.Entry.class));
    }

    @Test
    void should_completeEmpty_whenSecretDoesNotMatchHash() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        when(mcpTokenRepository.findByMcpKeyIdAndStatus(generated.id(), McpTokenStatus.ACTIVE))
                .thenReturn(Flux.just(persistedToken));

        StepVerifier.create(service.authenticate("mcp_" + generated.id() + "_wrong-secret"))
                .verifyComplete();
        verify(userRepository, never()).findById(anyString());
    }

    @Test
    void should_completeEmpty_whenTokenIsExpired() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        persistedToken.setExpiresAt(Instant.now().minusSeconds(60));
        when(mcpTokenRepository.findByMcpKeyIdAndStatus(generated.id(), McpTokenStatus.ACTIVE))
                .thenReturn(Flux.just(persistedToken));

        StepVerifier.create(service.authenticate(generated.token())).verifyComplete();
        verify(userRepository, never()).findById(anyString());
    }

    @Test
    void should_completeEmpty_whenUserIsDisabled() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        user.setIsEnabled(false);
        when(mcpTokenRepository.findByMcpKeyIdAndStatus(generated.id(), McpTokenStatus.ACTIVE))
                .thenReturn(Flux.just(persistedToken));
        when(userRepository.findById(user.getId())).thenReturn(Mono.just(user));

        StepVerifier.create(service.authenticate(generated.token())).verifyComplete();
    }

    @Test
    void should_notLoadUser_whenNoActiveTokenExists() {
        McpTokenResponseDTO generated = createToken("Claude Desktop", 30);
        when(mcpTokenRepository.findByMcpKeyIdAndStatus(generated.id(), McpTokenStatus.ACTIVE))
                .thenReturn(Flux.empty());

        StepVerifier.create(service.authenticate(generated.token())).verifyComplete();
        verify(userRepository, never()).findById(anyString());
    }

    private McpTokenResponseDTO createToken(String name, Integer keySpanDays) {
        stubCreatePersistence();
        return service.create(user, name, keySpanDays).block();
    }

    private void stubCreatePersistence() {
        when(mcpKeyRepository.countByUserIdAndRevokedAtIsNull(user.getId())).thenReturn(Mono.just(0L));
        when(mcpKeyRepository.save(any(McpKey.class))).thenAnswer(invocation -> {
            persistedKey = invocation.getArgument(0);
            if (persistedKey.getId() == null) {
                persistedKey.setId(new ObjectId().toString());
            }
            persistedKey.setCreatedAt(Instant.now());
            return Mono.just(persistedKey);
        });
        when(mcpTokenRepository.save(any(McpToken.class))).thenAnswer(invocation -> {
            persistedToken = invocation.getArgument(0);
            return Mono.just(persistedToken);
        });
    }

    private void stubRotatePersistence(McpKey key) {
        when(mcpKeyRepository.findByIdAndUserIdAndRevokedAtIsNull(key.getId(), user.getId()))
                .thenReturn(Mono.just(key));
        when(mcpTokenRepository.updateByMcpKeyIdAndStatus(
                        eq(key.getId()), eq(McpTokenStatus.ACTIVE), any(Update.class)))
                .thenReturn(Mono.just(1));
        when(mcpTokenRepository.save(any(McpToken.class))).thenAnswer(invocation -> {
            persistedToken = invocation.getArgument(0);
            return Mono.just(persistedToken);
        });
    }

    private static McpKey liveKey(String id, String name) {
        McpKey key = new McpKey();
        key.setId(id);
        key.setUserId("user-id");
        key.setName(name);
        key.setKeySpanDays(30);
        key.setCreatedAt(Instant.now());
        return key;
    }

    private static McpToken activeToken(McpKey key) {
        McpToken token = new McpToken();
        token.setMcpKeyId(key.getId());
        token.setUserId(key.getUserId());
        token.setStatus(McpTokenStatus.ACTIVE);
        token.setTokenHash("stored-hash");
        token.setExpiresAt(Instant.now().plus(Duration.ofDays(30)));
        token.setCreatedAt(Instant.now());
        return token;
    }
}
