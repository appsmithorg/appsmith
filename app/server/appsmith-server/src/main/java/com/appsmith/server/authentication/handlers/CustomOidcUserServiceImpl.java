package com.appsmith.server.authentication.handlers;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcReactiveOAuth2UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

/**
 * This class is invoked for SSO logins like <strong>Google</strong> which implement the {@link OAuth2User} interface for the user.
 * We transform the {@link OAuth2User} object to {@link User} object via the {@link #loadUser(OidcUserRequest)}
 * We also create the user if it doesn't exist we create it via {@link #checkAndCreateUser(OidcUser, OidcUserRequest)}
 */

@Slf4j
@Service
public class CustomOidcUserServiceImpl extends OidcReactiveOAuth2UserService
        implements ReactiveOAuth2UserService<OidcUserRequest, OidcUser> {

    private UserRepository repository;
    private UserService userService;

    @Autowired
    public CustomOidcUserServiceImpl(UserRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Override
    public Mono<OidcUser> loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        Mono<OidcUser> oidcUserMono = super.loadUser(userRequest);

        return oidcUserMono.flatMap(oidcUser -> checkAndCreateUser(oidcUser, userRequest));
    }

    /**
     * In case the user doesn't exist, create and save the user.
     */
    private Mono<User> checkAndCreateUser(OidcUser oidcUser, OidcUserRequest userRequest) {

        String username = (!StringUtils.isEmpty(oidcUser.getEmail())) ? oidcUser.getEmail() : oidcUser.getName();

        return repository.findByEmail(username)
                .switchIfEmpty(Mono.defer(() -> {
                    User newUser = new User();
                    if (oidcUser.getUserInfo() != null) {
                        newUser.setName(oidcUser.getUserInfo().getFullName());
                    } else {
                        newUser.setName(oidcUser.getName());
                    }
                    newUser.setEmail(username);
                    LoginSource loginSource = LoginSource.fromString(userRequest.getClientRegistration().getRegistrationId());
                    newUser.setSource(loginSource);
                    newUser.setState(UserState.ACTIVATED);
                    newUser.setIsEnabled(true);

                    return userService.create(newUser);
                }));
    }
}
