package com.appsmith.server.authentication.managers;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.User;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.UserMcpTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class McpTokenAuthenticationManagerTest {

    // A well-formed token id (UUID) and two real tokens sharing the same loopback client address but differing in
    // their public token id. "mcp_token" (no "." and no UUID) is a malformed token that falls back to the shared
    // "invalid" bucket.
    private static final String TOKEN_ID_A = "11111111-1111-1111-1111-111111111111";
    private static final String TOKEN_ID_B = "22222222-2222-2222-2222-222222222222";
    private static final String TOKEN_A = "mcp_" + TOKEN_ID_A + ".secretAAA";
    private static final String TOKEN_B = "mcp_" + TOKEN_ID_B + ".secretBBB";
    private static final String LOOPBACK = "127.0.0.1";

    @Mock
    private UserMcpTokenService userMcpTokenService;

    @Mock
    private RateLimitService rateLimitService;

    @Test
    void authenticate_usesValidatedTokenOwnerAsPrincipal() {
        User user = mock(User.class);
        when(user.getAuthorities()).thenReturn(List.of(new SimpleGrantedAuthority("test-authority")));
        McpTokenAuthenticationManager manager = manager();
        when(userMcpTokenService.authenticate("mcp_token")).thenReturn(Mono.just(user));
        when(rateLimitService.resetCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "unknown:invalid"))
                .thenReturn(Mono.empty());

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication("mcp_token")))
                .assertNext(authentication -> {
                    assertThat(authentication.isAuthenticated()).isTrue();
                    assertThat(authentication).isInstanceOf(UsernamePasswordAuthenticationToken.class);
                    assertThat(authentication.getPrincipal()).isSameAs(user);
                    assertThat(authentication.getAuthorities())
                            .extracting(GrantedAuthority::getAuthority)
                            .containsExactly("test-authority", McpTokenAuthentication.MCP_AUTHORITY);
                })
                .verifyComplete();

        // The token spent by the gate is returned on success, so a valid credential is never throttled.
        verify(rateLimitService).resetCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "unknown:invalid");
    }

    @Test
    void authenticate_rejectsInvalidMcpToken() {
        McpTokenAuthenticationManager manager = manager();
        // "mcp_token" has no "mcp_<uuid>." shape, so it keys the shared invalid bucket "unknown:invalid".
        String invalidBucket = "unknown:invalid";
        when(userMcpTokenService.authenticate("mcp_token")).thenReturn(Mono.empty());
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, invalidBucket))
                .thenReturn(Mono.just(true));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication("mcp_token")))
                .expectError(BadCredentialsException.class)
                .verify();

        verify(rateLimitService)
                .tryIncreaseCounter(eq(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION), eq(invalidBucket));
    }

    @Test
    void authenticate_rejectsRateLimitedSourceWithoutTokenLookup() {
        McpTokenAuthenticationManager manager = manager();
        String bucketA = LOOPBACK + ":" + TOKEN_ID_A;
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketA))
                .thenReturn(Mono.just(false));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication(TOKEN_A, LOOPBACK)))
                .expectError(BadCredentialsException.class)
                .verify();

        verify(userMcpTokenService, never()).authenticate(TOKEN_A);
    }

    @Test
    void authenticate_ignoresNonMcpAuthentication() {
        McpTokenAuthenticationManager manager = manager();
        Authentication authentication = mock(Authentication.class);

        StepVerifier.create(manager.authenticate(authentication)).verifyComplete();

        verify(rateLimitService, never()).tryIncreaseCounter(any(), any());
    }

    // Core M2-T3 regression: two DIFFERENT tokens arriving from the SAME loopback client address must land in
    // DIFFERENT buckets, so brute-forcing one token cannot lock out the other. Before the fix both shared the single
    // client-address bucket ("127.0.0.1") and one lockout took down all tokens.
    @Test
    void authenticate_differentTokensSameClientAddress_useDifferentBuckets() {
        McpTokenAuthenticationManager manager =
                new McpTokenAuthenticationManager(userMcpTokenService, rateLimitService);
        String bucketA = LOOPBACK + ":" + TOKEN_ID_A;
        String bucketB = LOOPBACK + ":" + TOKEN_ID_B;

        // Token A is rate-limited; token B is not. Independent buckets means A's lockout must not affect B.
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketA))
                .thenReturn(Mono.just(false));
        when(userMcpTokenService.authenticate(TOKEN_B)).thenReturn(Mono.empty());
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketB))
                .thenReturn(Mono.just(true));

        // Token A: locked out, rejected without a lookup.
        StepVerifier.create(manager.authenticate(new McpTokenAuthentication(TOKEN_A, LOOPBACK)))
                .expectError(BadCredentialsException.class)
                .verify();
        verify(userMcpTokenService, never()).authenticate(TOKEN_A);

        // Token B: NOT locked out despite sharing the client address; it is looked up and its own counter increments.
        StepVerifier.create(manager.authenticate(new McpTokenAuthentication(TOKEN_B, LOOPBACK)))
                .expectError(BadCredentialsException.class)
                .verify();
        verify(userMcpTokenService).authenticate(TOKEN_B);
        verify(rateLimitService).tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketB);
        // Bucket A was charged exactly once — by token A's own attempt — so token B's attempt never touched it.
        verify(rateLimitService, times(1))
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketA);
    }

    // The bucket key must be built from the PUBLIC token id (the UUID before '.') and must never contain the secret
    // half of the token, since the key can be persisted/logged by the rate-limiting backend.
    @Test
    void authenticate_bucketKeyContainsPublicTokenIdNotSecret() {
        McpTokenAuthenticationManager manager =
                new McpTokenAuthenticationManager(userMcpTokenService, rateLimitService);
        String secret = UUID.randomUUID().toString();
        String token = "mcp_" + TOKEN_ID_A + "." + secret;
        when(userMcpTokenService.authenticate(token)).thenReturn(Mono.empty());

        ArgumentCaptor<String> incrementKey = ArgumentCaptor.forClass(String.class);
        when(rateLimitService.tryIncreaseCounter(
                        eq(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION), incrementKey.capture()))
                .thenReturn(Mono.just(true));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication(token, LOOPBACK)))
                .expectError(BadCredentialsException.class)
                .verify();

        assertThat(incrementKey.getValue()).isEqualTo(LOOPBACK + ":" + TOKEN_ID_A);
        assertThat(incrementKey.getValue()).doesNotContain(secret);
    }

    // Regression for the TOCTOU in the MCP auth gate. The manager used to read the remaining token count, verify the
    // credential, and only then consume a token on the failure path. Because the read consumed nothing, every request
    // in a concurrent burst observed the same non-zero count and every one of them reached the credential
    // verification — the bucket bounded sequential attempts only, so N simultaneous attempts bought N verifications.
    // The fix is to spend the token atomically before verifying; this asserts that ordering, which is the part of the
    // race that can be pinned down deterministically (the interleaving itself cannot be forced in a unit test).
    @Test
    void authenticate_spendsRateLimitTokenBeforeVerifyingCredential() {
        McpTokenAuthenticationManager manager = manager();
        String bucket = LOOPBACK + ":" + TOKEN_ID_A;
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucket))
                .thenReturn(Mono.just(true));
        when(userMcpTokenService.authenticate(TOKEN_A)).thenReturn(Mono.empty());

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication(TOKEN_A, LOOPBACK)))
                .expectError(BadCredentialsException.class)
                .verify();

        InOrder inOrder = inOrder(rateLimitService, userMcpTokenService);
        inOrder.verify(rateLimitService)
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucket);
        inOrder.verify(userMcpTokenService).authenticate(TOKEN_A);
    }

    // The other half of the same property: once the bucket is empty the credential check must not run at all, so a
    // flood of attempts cannot keep buying verifications.
    @Test
    void authenticate_exhaustedBucketPerformsNoCredentialVerification() {
        McpTokenAuthenticationManager manager = manager();
        String bucket = LOOPBACK + ":" + TOKEN_ID_A;
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucket))
                .thenReturn(Mono.just(false));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication(TOKEN_A, LOOPBACK)))
                .expectError(BadCredentialsException.class)
                .verify();

        verify(userMcpTokenService, never()).authenticate(TOKEN_A);
    }

    private McpTokenAuthenticationManager manager() {
        // Lenient: tests that reject non-MCP auth or a rate-limited source never reach this stub. The default
        // "mcp_token" credential with the default "unknown" client address keys the shared invalid bucket.
        lenient()
                .when(rateLimitService.tryIncreaseCounter(
                        RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "unknown:invalid"))
                .thenReturn(Mono.just(true));
        return new McpTokenAuthenticationManager(userMcpTokenService, rateLimitService);
    }
}
