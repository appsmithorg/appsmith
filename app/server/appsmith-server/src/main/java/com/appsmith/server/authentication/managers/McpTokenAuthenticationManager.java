package com.appsmith.server.authentication.managers;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.services.UserMcpTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class McpTokenAuthenticationManager implements ReactiveAuthenticationManager {

    private final UserMcpTokenService userMcpTokenService;

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        if (!(authentication instanceof McpTokenAuthentication)) {
            return Mono.empty();
        }

        return userMcpTokenService
                .authenticate((String) authentication.getCredentials())
                .map(user -> (Authentication) UsernamePasswordAuthenticationToken.authenticated(
                        user, null, Optional.ofNullable(user.getAuthorities()).orElseGet(List::of)))
                .switchIfEmpty(Mono.error(new BadCredentialsException("Invalid MCP token")));
    }
}
