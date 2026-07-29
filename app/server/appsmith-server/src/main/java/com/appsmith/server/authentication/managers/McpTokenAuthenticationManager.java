package com.appsmith.server.authentication.managers;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.User;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.UserMcpTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

// Intentionally NOT a @Component/@Bean: as the only ReactiveAuthenticationManager bean it would be auto-wired as the
// global default and hijack form-login (which then rejects UsernamePasswordAuthenticationToken -> 500). SecurityConfig
// constructs it directly for the MCP filter instead.
@RequiredArgsConstructor
public class McpTokenAuthenticationManager implements ReactiveAuthenticationManager {

    private static final String MCP_TOKEN_PREFIX = "mcp_";
    // Bucket-key component for a syntactically invalid token (no "mcp_<uuid>." shape). Such tokens can never
    // authenticate, so collapsing them into one shared bucket only throttles obvious garbage and never affects a
    // real token's bucket.
    private static final String INVALID_TOKEN_ID = "invalid";

    private final UserMcpTokenService userMcpTokenService;
    private final RateLimitService rateLimitService;

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        if (!(authentication instanceof McpTokenAuthentication)) {
            return Mono.empty();
        }

        McpTokenAuthentication mcpTokenAuthentication = (McpTokenAuthentication) authentication;
        final String bucketKey = rateLimitKey(mcpTokenAuthentication);

        // Spend a token BEFORE the credential check, not after. Reading the remaining count and then verifying the
        // credential leaves a window in which every concurrent request sees the same non-zero count, so an attacker
        // firing N requests at once gets N credential verifications regardless of the limit — the bucket only ever
        // bounded sequential attempts. tryIncreaseCounter is a single atomic tryConsume, so exactly `capacity`
        // requests can be in flight against a bucket no matter how they are interleaved.
        //
        // A proven-good credential must not pay for this: authentication runs on every MCP request (bearer tokens,
        // no session), and this bucket allows 5/min, so charging every request would cap a legitimate client at 5
        // requests per minute. Success therefore resets the bucket, which both returns the token just spent and
        // clears earlier failures — a caller that just proved it holds a valid token is not the one being throttled.
        return rateLimitService
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketKey)
                // Preserve the previous posture of failing open: a rate-limiter outage must not lock out MCP auth.
                .onErrorReturn(true)
                .flatMap(tokenAcquired -> {
                    if (!tokenAcquired) {
                        return invalidMcpToken();
                    }

                    return userMcpTokenService
                            .authenticate((String) authentication.getCredentials())
                            .flatMap(user -> rateLimitService
                                    .resetCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, bucketKey)
                                    .onErrorResume(error -> Mono.empty())
                                    .thenReturn((Authentication) UsernamePasswordAuthenticationToken.authenticated(
                                            user, null, mcpAuthorities(user))))
                            // The token was already spent above, so a failed attempt needs no further accounting.
                            .switchIfEmpty(invalidMcpToken());
                });
    }

    /**
     * Builds the per-attempt rate-limit bucket key. Keying purely on the client address is ineffective for MCP:
     * every mcp_ auth attempt reaches this manager through the loopback Node MCP service (decision D2), which does
     * not propagate the caller's X-Forwarded-For, so getRemoteAddress() is 127.0.0.1 for ALL callers. That collapses
     * every token into one shared bucket, letting a single attacker trip the global lockout (5/min) and deny MCP auth
     * to every token — an availability DoS. We therefore compose the key with the token's PUBLIC id (the UUID in
     * {@code mcp_<tokenId>.<secret>}, the same value returned by list()/getTokenId(), safe to key on and never the
     * secret half after '.') so each token is throttled in its own bucket. The client address is retained as a prefix
     * so the keying stays correct if a future ingress path ever supplies a real client IP.
     */
    private static String rateLimitKey(McpTokenAuthentication authentication) {
        return authentication.getClientAddress() + ":" + tokenIdComponent((String) authentication.getCredentials());
    }

    /**
     * Extracts the public token id (the UUID between the {@code mcp_} prefix and the first '.') for use as a bucket
     * key. Never returns the secret portion of the token. Falls back to {@link #INVALID_TOKEN_ID} for any token that
     * does not match the expected shape.
     */
    private static String tokenIdComponent(String token) {
        if (token == null || !token.startsWith(MCP_TOKEN_PREFIX)) {
            return INVALID_TOKEN_ID;
        }

        int separatorIndex = token.indexOf('.', MCP_TOKEN_PREFIX.length());
        if (separatorIndex == -1) {
            return INVALID_TOKEN_ID;
        }

        try {
            return UUID.fromString(token.substring(MCP_TOKEN_PREFIX.length(), separatorIndex))
                    .toString();
        } catch (IllegalArgumentException exception) {
            return INVALID_TOKEN_ID;
        }
    }

    private Mono<Authentication> invalidMcpToken() {
        return Mono.error(new BadCredentialsException("Invalid MCP token"));
    }

    private static List<GrantedAuthority> mcpAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        Collection<? extends GrantedAuthority> existing = user.getAuthorities();
        if (existing != null) {
            authorities.addAll(existing);
        }
        authorities.add(new SimpleGrantedAuthority(McpTokenAuthentication.MCP_AUTHORITY));
        return authorities;
    }
}
