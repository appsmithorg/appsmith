package com.appsmith.server.configurations;

import com.appsmith.server.configurations.solutions.OidcAccessTokenUpdateSolution;
import com.appsmith.server.domains.AppsmithOidcAccessToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.services.UserDataService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Objects;

import static com.appsmith.server.configurations.ClientUserRepository.DEFAULT_AUTHORIZED_CLIENTS_ATTR_NAME;
import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Slf4j
@Component
public class SessionFilter implements WebFilter {

    private final UserDataService userDataService;

    private final OidcAccessTokenUpdateSolution oidcAccessTokenUpdateSolution;

    public SessionFilter(UserDataService userDataService, OidcAccessTokenUpdateSolution oidcAccessTokenUpdateSolution) {
        this.userDataService = userDataService;
        this.oidcAccessTokenUpdateSolution = oidcAccessTokenUpdateSolution;
    }

    @Override
    public Mono<Void> filter(final ServerWebExchange serverWebExchange, final WebFilterChain webFilterChain) {

        Mono<WebSession> sessionMono = serverWebExchange.getSession().cache();
        Mono<SecurityContext> securityContextMono = ReactiveSecurityContextHolder.getContext();

        return Mono.zip(sessionMono, securityContextMono)
                .flatMap(tuple -> {
                    WebSession session = tuple.getT1();
                    SecurityContext securityContext = tuple.getT2();
                    return checkSessionAndRefreshOidcToken(session, securityContext);
                })
                .zipWith(sessionMono)
                .flatMap(tuple -> {
                    Boolean isSessionValid = tuple.getT1();
                    WebSession session = tuple.getT2();
                    if (!isSessionValid) {
                        // If the session is invalid according to our logic, invalidation of the session would lead to
                        // the user getting logged out.
                        return session.invalidate();
                    }
                    return Mono.empty();
                })
                .then(webFilterChain.filter(serverWebExchange));
    }

    private Mono<Boolean> checkSessionAndRefreshOidcToken(WebSession session, SecurityContext context) {

        final Authentication currentToken = context.getAuthentication();
        Map<String, Object> attributes = session.getAttributes();

        if (currentToken instanceof OAuth2AuthenticationToken) {

            String email = ((User) currentToken.getPrincipal()).getEmail();

            if (attributes.containsKey(DEFAULT_AUTHORIZED_CLIENTS_ATTR_NAME)
                    && attributes.containsKey(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME)) {

                Map authorizedClients = (Map) attributes.get(DEFAULT_AUTHORIZED_CLIENTS_ATTR_NAME);
                SecurityContext spring_security_context =
                        (SecurityContext) attributes.get(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME);
                OAuth2AuthenticationToken authentication =
                        (OAuth2AuthenticationToken) spring_security_context.getAuthentication();
                String client = authentication.getAuthorizedClientRegistrationId();
                final OAuth2AuthorizedClient oidcClient = (OAuth2AuthorizedClient) authorizedClients.get(client);

                // Only refresh tokens for OIDC client and not for google/github since the JWT tokens exposed
                // for them are currently not useful for appsmith app developers since they can't configure scopes
                // during authentication.
                if (!client.equals("oidc")) {
                    return Mono.just(Boolean.TRUE);
                }

                return userDataService.getForUserEmail(email).flatMap(userData -> {
                    AppsmithOidcAccessToken accessToken = userData.getOidcAccessToken();
                    Map<String, Object> oidcIdTokenClaims = userData.getOidcIdTokenClaims();

                    // If for some reason the oauth2accesstoken does not exist, invalidate the session
                    // so that the access token can be set again.
                    if (accessToken == null || MapUtils.isEmpty(oidcIdTokenClaims)) {
                        return Mono.just(Boolean.FALSE);
                    } else {
                        UserData updatesForuserData;
                        try {
                            updatesForuserData =
                                    oidcAccessTokenUpdateSolution
                                            .getUserDataResourceForUpdatingAccessTokenAndOidcTokenIfRequired(
                                                    userData, oidcClient);
                        } catch (Exception exception) {
                            log.error(
                                    "Unable to fetch the access token and oidc data for {}. Error: {}",
                                    email,
                                    exception.getMessage());
                            return Mono.just(Boolean.FALSE);
                        }

                        if (Objects.nonNull(updatesForuserData)) {
                            return userDataService
                                    .updateForCurrentUser(updatesForuserData)
                                    .thenReturn(Boolean.TRUE);
                        }
                        return Mono.just(Boolean.TRUE);
                    }
                });

            } else {
                // We have an erroneous state for the session authenticated with oauth2 where spring has not set the
                // attributes correctly. Continue as is since we don't know when it happens.
                // TODO : Should we invalidate the session so that the user is logged out?
                log.debug("User {} who is authenticated via OAuth2 does not have correct attributes set. ", email);
            }
        }

        return Mono.just(Boolean.TRUE);
    }
}
