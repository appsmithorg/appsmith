package com.appsmith.server.authentication.managers;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Component
public class ApiKeyAuthenticationManager implements ReactiveAuthenticationManager {
    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        if (Objects.nonNull(authentication)) {
            String apiKey = (String) authentication.getCredentials();
            if (StringUtils.isNotEmpty(apiKey) && Objects.nonNull(authentication.getPrincipal())) {
                authentication.setAuthenticated(true);
            }
        }
        return Mono.just(authentication);
    }
}