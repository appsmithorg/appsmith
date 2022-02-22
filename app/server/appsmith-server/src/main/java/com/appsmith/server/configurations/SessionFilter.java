package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.endpoint.DefaultRefreshTokenTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2RefreshTokenGrantRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class SessionFilter implements WebFilter {

    DefaultRefreshTokenTokenResponseClient refreshTokenClient = new DefaultRefreshTokenTokenResponseClient();


    @Override
    public Mono<Void> filter(final ServerWebExchange serverWebExchange, final WebFilterChain webFilterChain) {

        // Leaving the code here commented to come back for refresh token flow.

        return serverWebExchange.getSession()
//                .zipWith(ReactiveSecurityContextHolder.getContext())
//                .map(tuple -> {
//
//                    WebSession session = tuple.getT1();
//                    SecurityContext context = tuple.getT2();
//
//                    final Authentication currentToken = context.getAuthentication();
//                    if (currentToken instanceof OAuth2AuthenticationToken) {
//                        Map<String, Object> attributes = session.getAttributes();
//                        if (attributes.containsKey(DEFAULT_AUTHORIZED_CLIENTS_ATTR_NAME))
//                    }
//
//                    // if oauth and access token expired
//                    //   1. update auth token : refreshCurrentUser
//
//                    final Map<String, Object> attributes = session.getAttributes();
//                    final Map o = (Map) attributes.get("org.springframework.security.oauth2.client.web.server.WebSessionServerOAuth2AuthorizedClientRepository.AUTHORIZED_CLIENTS");
//                    org.springframework.security.core.context.SecurityContextImpl spring_security_context = (org.springframework.security.core.context.SecurityContextImpl) attributes.get(org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME);
//                    OAuth2AuthenticationToken authentication = (OAuth2AuthenticationToken) spring_security_context.getAuthentication();
//                    String client = authentication.getAuthorizedClientRegistrationId();
//                    final OAuth2AuthorizedClient oidcClient = (OAuth2AuthorizedClient) o.get(client);
//                    if (oidcClient.getAccessToken().getExpiresAt().isBefore(Instant.now().plus(1, ChronoUnit.MINUTES))) {
//                        o.put("oidc", getNewAccessToken(oidcClient));
//                        return session.save();
//                    } else {
//                        o.put("oidc", getNewAccessToken(oidcClient));
//                        return session.save();
//                    }
//                     return Mono.empty();
//                })
                .then(webFilterChain.filter(serverWebExchange));

    }

    private OAuth2AuthorizedClient getNewAccessToken(OAuth2AuthorizedClient oidcClient) {

        // ???? For okta, refresh token is null in oidcClient
        final OAuth2RefreshTokenGrantRequest refreshTokenGrantRequest = new OAuth2RefreshTokenGrantRequest(oidcClient.getClientRegistration(),
                oidcClient.getAccessToken(), oidcClient.getRefreshToken(), oidcClient.getAccessToken().getScopes());
        final OAuth2AccessTokenResponse tokenResponse = refreshTokenClient.getTokenResponse(refreshTokenGrantRequest);

        return new OAuth2AuthorizedClient(oidcClient.getClientRegistration(), oidcClient.getPrincipalName(),
                tokenResponse.getAccessToken(), tokenResponse.getRefreshToken());
    }
}
