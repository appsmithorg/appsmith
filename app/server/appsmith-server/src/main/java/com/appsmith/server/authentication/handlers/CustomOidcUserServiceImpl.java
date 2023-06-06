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
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.DefaultReactiveOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class CustomOidcUserServiceImpl extends CustomOidcUserServiceCEImpl
        implements ReactiveOAuth2UserService<OidcUserRequest, OidcUser> {

    private final UserRepository repository;
    private final UserService userService;
    private final UserDataService userDataService;

    @Autowired
    public CustomOidcUserServiceImpl(UserRepository repository,
                                     UserService userService,
                                     UserDataService userDataService) {

        super(repository, userService);
        this.repository = repository;
        this.userService = userService;
        this.userDataService = userDataService;

        // Override the `webClient` used, for Proxy support.
        final DefaultReactiveOAuth2UserService defaultUserService = new DefaultReactiveOAuth2UserService();
        defaultUserService.setWebClient(WebClientUtils.create());
        setOauth2UserService(defaultUserService);
    }

    @Override
    public Mono<User> checkAndCreateUser(OidcUser oidcUser, OidcUserRequest userRequest) {

        return super.checkAndCreateUser(oidcUser, userRequest)
                .flatMap(user -> {
                    final UserData updates = new UserData();

                    OAuth2AccessToken accessToken = userRequest.getAccessToken();
                    Map<String, Object> idTokenClaims = userRequest.getIdToken().getClaims();
                    Map<String, Object> userClaims = oidcUser.getUserInfo().getClaims();

                    updates.setOidcAccessToken(
                            new AppsmithOidcAccessToken(
                                    accessToken.getTokenType(),
                                    accessToken.getScopes(),
                                    accessToken.getTokenValue(),
                                    accessToken.getIssuedAt(),
                                    accessToken.getExpiresAt())
                    );

                    updates.setUserClaims(userClaims);
                    updates.setOidcIdTokenClaims(idTokenClaims);

                    return userDataService.updateForUser(user, updates)
                            .thenReturn(user);
                });
    }
}
