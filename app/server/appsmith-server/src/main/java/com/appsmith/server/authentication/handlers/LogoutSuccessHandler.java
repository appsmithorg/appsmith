package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.LogoutSuccessHandlerCE;
import com.appsmith.server.configurations.OAuthPostLogoutConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserDataService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Slf4j
public class LogoutSuccessHandler extends LogoutSuccessHandlerCE {

    private final UserDataService userDataService;
    private final ReactiveClientRegistrationRepository reactiveClientRegistrationRepository;

    private final OAuthPostLogoutConfiguration oAuthPostLogoutConfiguration;

    public LogoutSuccessHandler(
            AnalyticsService analyticsService,
            UserDataService userDataService,
            ReactiveClientRegistrationRepository reactiveClientRegistrationRepository,
            OAuthPostLogoutConfiguration oAuthPostLogoutConfiguration) {
        super(analyticsService);
        this.userDataService = userDataService;
        this.reactiveClientRegistrationRepository = reactiveClientRegistrationRepository;
        this.oAuthPostLogoutConfiguration = oAuthPostLogoutConfiguration;
    }

    @Override
    protected Mono<String> generatePostLogoutRedirectUri(
            WebFilterExchange webFilterExchange, Authentication authentication) {

        return Mono.just(authentication)
                .filter(OAuth2AuthenticationToken.class::isInstance)
                .filter((token) -> authentication.getPrincipal() instanceof OidcUser)
                .map(OAuth2AuthenticationToken.class::cast)
                .map(OAuth2AuthenticationToken::getAuthorizedClientRegistrationId)
                .filter(oAuthPostLogoutConfiguration::shouldLogoutOfOAuth)
                .flatMap(this.reactiveClientRegistrationRepository::findByRegistrationId)
                .flatMap((clientRegistration) -> {
                    User user = User.class.cast(authentication.getPrincipal());
                    Mono<UserData> userDataMono = userDataService.getForUser(user.getId());
                    return userDataMono.flatMap(userData -> {
                        URI endSessionEndpoint = endSessionEndpoint(clientRegistration);
                        if (Objects.isNull(endSessionEndpoint)) {
                            return Mono.empty();
                        }
                        String idToken = idToken(userData);
                        String postLogoutRedirectUri = postLogoutRedirectUri(
                                webFilterExchange.getExchange().getRequest());
                        return Mono.just(endpointUri(endSessionEndpoint, idToken, postLogoutRedirectUri));
                    });
                })
                .switchIfEmpty(super.generatePostLogoutRedirectUri(webFilterExchange, authentication));
    }

    private URI endSessionEndpoint(ClientRegistration clientRegistration) {
        if (clientRegistration != null) {
            Object endSessionEndpoint = clientRegistration
                    .getProviderDetails()
                    .getConfigurationMetadata()
                    .get("end_session_endpoint");
            if (endSessionEndpoint != null) {
                return URI.create(endSessionEndpoint.toString());
            }
        }
        return null;
    }

    private String endpointUri(URI endSessionEndpoint, String idToken, String postLogoutRedirectUri) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUri(endSessionEndpoint);
        builder.queryParam("id_token_hint", idToken);
        if (postLogoutRedirectUri != null) {
            builder.queryParam("post_logout_redirect_uri", postLogoutRedirectUri);
        }
        return builder.encode(StandardCharsets.UTF_8).build().toUriString();
    }

    private String idToken(UserData userData) {
        return userData.getRawIdToken();
    }
}
