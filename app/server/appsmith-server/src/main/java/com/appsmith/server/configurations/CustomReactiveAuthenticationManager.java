package com.appsmith.server.configurations;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthorizationCodeReactiveAuthenticationManager;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.ReactiveOAuth2AccessTokenResponseClient;
import reactor.core.publisher.Mono;

//@Component
public class CustomReactiveAuthenticationManager
        extends OAuth2AuthorizationCodeReactiveAuthenticationManager
        implements ReactiveAuthenticationManager {

    public CustomReactiveAuthenticationManager(
            ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> accessTokenResponseClient) {
        super(accessTokenResponseClient);
    }

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        boolean val = true;
        if(val) {
            return Mono.error(new Exception("something"));
        }
        return super.authenticate(authentication);
    }
}
