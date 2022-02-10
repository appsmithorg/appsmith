package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomOidcUserServiceCEImpl;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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
    }

    @Override
    public Mono<User> checkAndCreateUser(OidcUser oidcUser, OidcUserRequest userRequest) {

        return super.checkAndCreateUser(oidcUser, userRequest)
                .flatMap(user -> {
                    final UserData userData = new UserData();
                    String accessToken = userRequest.getAccessToken().getTokenValue();
                    Map<String, Object> userClaims = oidcUser.getUserInfo().getClaims();

                    userData.setAccessToken(accessToken);
                    userData.setUserClaims(userClaims);

                    return userDataService.update(user.getId(), userData)
                            .thenReturn(user);
                });
    }
}
