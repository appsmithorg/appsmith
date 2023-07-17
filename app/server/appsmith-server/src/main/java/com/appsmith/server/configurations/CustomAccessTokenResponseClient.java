package com.appsmith.server.configurations;

import com.appsmith.util.WebClientUtils;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.WebClientReactiveAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class CustomAccessTokenResponseClient extends WebClientReactiveAuthorizationCodeTokenResponseClient {

    private static final WebClient webClient = WebClientUtils.builder().build();

    @Override
    public Mono<OAuth2AccessTokenResponse> getTokenResponse(OAuth2AuthorizationCodeGrantRequest grantRequest) {
        setWebClient(webClient);
        return super.getTokenResponse(grantRequest);
    }
}
