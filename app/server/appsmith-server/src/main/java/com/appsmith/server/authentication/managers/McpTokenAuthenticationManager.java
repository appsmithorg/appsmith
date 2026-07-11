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

// Intentionally NOT a @Component/@Bean: as the only ReactiveAuthenticationManager bean it would be auto-wired as the
// global default and hijack form-login (which then rejects UsernamePasswordAuthenticationToken -> 500). SecurityConfig
// constructs it directly for the MCP filter instead.
@RequiredArgsConstructor
public class McpTokenAuthenticationManager implements ReactiveAuthenticationManager {

    private final UserMcpTokenService userMcpTokenService;
    private final RateLimitService rateLimitService;

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        if (!(authentication instanceof McpTokenAuthentication)) {
            return Mono.empty();
        }

        McpTokenAuthentication mcpTokenAuthentication = (McpTokenAuthentication) authentication;

        return rateLimitService
                .isRateLimitExceeded(
                        RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION, mcpTokenAuthentication.getClientAddress())
                .onErrorReturn(false)
                .flatMap(rateLimitExceeded -> {
                    if (rateLimitExceeded) {
                        return invalidMcpToken();
                    }

                    return userMcpTokenService
                            .authenticate((String) authentication.getCredentials())
                            .map(user -> (Authentication)
                                    UsernamePasswordAuthenticationToken.authenticated(user, null, mcpAuthorities(user)))
                            .switchIfEmpty(Mono.defer(() -> rateLimitService
                                    .tryIncreaseCounter(
                                            RateLimitConstants.BUCKET_KEY_FOR_MCP_AUTHENTICATION,
                                            mcpTokenAuthentication.getClientAddress())
                                    .onErrorResume(error -> Mono.empty())
                                    .then(invalidMcpToken())));
                });
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
