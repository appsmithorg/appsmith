package com.appsmith.server.authentication.managers;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.UserMcpTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class McpTokenAuthenticationManagerTest {

    @Mock
    private UserMcpTokenService userMcpTokenService;

    @Test
    void authenticate_usesValidatedTokenOwnerAsPrincipal() {
        User user = mock(User.class);
        when(user.getAuthorities()).thenReturn(List.of(new SimpleGrantedAuthority("test-authority")));
        McpTokenAuthenticationManager manager = new McpTokenAuthenticationManager(userMcpTokenService);
        when(userMcpTokenService.authenticate("mcp_token")).thenReturn(Mono.just(user));

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication("mcp_token")))
                .assertNext(authentication -> {
                    assertThat(authentication.isAuthenticated()).isTrue();
                    assertThat(authentication).isInstanceOf(UsernamePasswordAuthenticationToken.class);
                    assertThat(authentication.getPrincipal()).isSameAs(user);
                    assertThat(authentication.getAuthorities())
                            .extracting(GrantedAuthority::getAuthority)
                            .containsExactly("test-authority");
                })
                .verifyComplete();
    }

    @Test
    void authenticate_rejectsInvalidMcpToken() {
        McpTokenAuthenticationManager manager = new McpTokenAuthenticationManager(userMcpTokenService);
        when(userMcpTokenService.authenticate("mcp_token")).thenReturn(Mono.empty());

        StepVerifier.create(manager.authenticate(new McpTokenAuthentication("mcp_token")))
                .expectError(BadCredentialsException.class)
                .verify();
    }
}
