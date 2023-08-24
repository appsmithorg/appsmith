package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomOidcUserServiceCEImpl;
import com.appsmith.server.domains.AppsmithOidcAccessToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.DefaultReactiveOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class CustomOidcUserServiceImpl extends CustomOidcUserServiceCEImpl
        implements ReactiveOAuth2UserService<OidcUserRequest, OidcUser> {

    private final UserRepository repository;
    private final UserService userService;
    private final UserDataService userDataService;
    private WebClient webClient;

    /*
       This filter is used to log the response body of the UserInfo endpoint. This is only for debugging purposes because
       some responses from Okta are being returned with text/html content-type instead of application/json. We only log
       errors for such responses because we don't want to affect existing users who are using Okta as their OIDC provider.
       Will be removed once the erroneous response is fixed.
    */
    private ExchangeFilterFunction logResponse = ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
        String responseContentType =
                clientResponse.headers().asHttpHeaders().getContentType().toString();
        if (!responseContentType.equalsIgnoreCase(MediaType.APPLICATION_JSON_VALUE)
                && !responseContentType.equalsIgnoreCase(MediaType.APPLICATION_JSON_UTF8_VALUE)) {
            log.debug("UserInfo response content-type: {}", responseContentType);
            return clientResponse.bodyToMono(String.class).map(response -> {
                log.debug("UserInfo response body: {}", response);
                return clientResponse;
            });
        }
        return Mono.just(clientResponse);
    });

    @Autowired
    public CustomOidcUserServiceImpl(
            UserRepository repository, UserService userService, UserDataService userDataService) {

        super(repository, userService);
        this.repository = repository;
        this.userService = userService;
        this.userDataService = userDataService;

        // Override the `webClient` used, for Proxy support.
        final DefaultReactiveOAuth2UserService defaultUserService = new DefaultReactiveOAuth2UserService();
        defaultUserService.setWebClient(WebClientUtils.create());
        setOauth2UserService(defaultUserService);

        // DEBUG: Log the response body of the UserInfo endpoint. Will be removed once the erroneous response is fixed.
        webClient = WebClient.builder().filter(logResponse).build();
    }

    /*
     * TODO :
     * Delete loadUser method after debugging the erroneous user info response.
     */
    @Override
    public Mono<OidcUser> loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {

        return logUserInfoResponse(userRequest).then(super.loadUser(userRequest));
    }

    private Mono<Boolean> logUserInfoResponse(OidcUserRequest userRequest) {
        String userInfoUri = userRequest
                .getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUri();
        WebClient.RequestHeadersSpec<?> requestHeadersSpec = this.webClient
                .get()
                .uri(userInfoUri)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .headers((headers) ->
                        headers.setBearerAuth(userRequest.getAccessToken().getTokenValue()));

        return requestHeadersSpec.retrieve().bodyToMono(String.class).map(res -> {
            log.debug("User info response is :\n{}", res);
            return true;
        });
    }

    @Override
    public Mono<User> checkAndCreateUser(OidcUser oidcUser, OidcUserRequest userRequest) {

        return super.checkAndCreateUser(oidcUser, userRequest).flatMap(user -> {
            final UserData updates = new UserData();

            OAuth2AccessToken accessToken = userRequest.getAccessToken();
            Map<String, Object> idTokenClaims = userRequest.getIdToken().getClaims();
            Map<String, Object> userClaims = oidcUser.getUserInfo().getClaims();
            String rawIdToken = (String) userRequest.getAdditionalParameters().get(OidcParameterNames.ID_TOKEN);

            updates.setOidcAccessToken(new AppsmithOidcAccessToken(
                    accessToken.getTokenType(),
                    accessToken.getScopes(),
                    accessToken.getTokenValue(),
                    accessToken.getIssuedAt(),
                    accessToken.getExpiresAt()));

            updates.setUserClaims(userClaims);
            updates.setOidcIdTokenClaims(idTokenClaims);
            updates.setRawIdToken(rawIdToken);

            return userDataService.updateForUser(user, updates).thenReturn(user);
        });
    }
}
