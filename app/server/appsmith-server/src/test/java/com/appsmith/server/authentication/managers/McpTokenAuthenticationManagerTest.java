package com.appsmith.server.authentication.managers;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.User;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.UserMcpTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class McpTokenAuthenticationManagerTest {

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

        verify(rateLimitService, never())
                .tryIncreaseCounter(eq(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION), eq("unknown"));
    }

    @Test
    void authenticate_rejectsInvalidMcpToken() {
        McpTokenAuthenticationManager manager = manager();
        when(userMcpTokenService.authenticate("mcp_token")).thenReturn(Mono.empty());
        when(rateLimitService.tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "unknown"))
                .thenReturn(Mono.just(true));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication("mcp_token")))
                .expectError(BadCredentialsException.class)
                .verify();

        verify(rateLimitService)
                .tryIncreaseCounter(eq(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION), eq("unknown"));
    }

    @Test
    void authenticate_rejectsRateLimitedSourceWithoutTokenLookup() {
        McpTokenAuthenticationManager manager = manager();
        when(rateLimitService.isRateLimitExceeded(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "192.0.2.1"))
                .thenReturn(Mono.just(true));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication("mcp_token", "192.0.2.1")))
                .expectError(BadCredentialsException.class)
                .verify();

        verify(userMcpTokenService, never()).authenticate("mcp_token");
    }

    @Test
    void authenticate_ignoresNonMcpAuthentication() {
        McpTokenAuthenticationManager manager = manager();
        Authentication authentication = mock(Authentication.class);

        StepVerifier.create(manager.authenticate(authentication)).verifyComplete();

        verify(rateLimitService, never())
                .isRateLimitExceeded(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "unknown");
    }

    private McpTokenAuthenticationManager manager() {
        when(rateLimitService.isRateLimitExceeded(RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, "unknown"))
                .thenReturn(Mono.just(false));
        return new McpTokenAuthenticationManager(userMcpTokenService, rateLimitService);
    }
}
