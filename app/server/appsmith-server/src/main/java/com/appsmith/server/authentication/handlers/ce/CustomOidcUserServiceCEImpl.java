package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcReactiveOAuth2UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

/**
 * This class is invoked for SSO logins like <strong>Google</strong> which implement the {@link OAuth2User} interface for the user.
 * We transform the {@link OAuth2User} object to {@link User} object via the {@link #loadUser(OidcUserRequest)}
 * We also create the user if it doesn't exist we create it via {@link #checkAndCreateUser(OidcUser, OidcUserRequest)}
 */

@Slf4j
public class CustomOidcUserServiceCEImpl extends OidcReactiveOAuth2UserService {

    private UserRepository repository;
    private UserService userService;

    @Autowired
    public CustomOidcUserServiceCEImpl(UserRepository repository, UserService userService) {
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
    public Mono<User> checkAndCreateUser(OidcUser oidcUser, OidcUserRequest userRequest) {

        String username = (!StringUtils.isEmpty(oidcUser.getEmail())) ? oidcUser.getEmail() : oidcUser.getName();

        return repository.findByEmail(username)
                .switchIfEmpty(repository.findByCaseInsensitiveEmail(username))
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
                }))
                .flatMap(user -> {
                    if (!user.getIsEnabled()) {
                        user.setIsEnabled(true);
                        return repository.save(user);
                    }
                    return Mono.just(user);
                })
                .onErrorMap(
                        AppsmithException.class,
                        error -> new OAuth2AuthenticationException(
                                new OAuth2Error(error.getAppErrorCode().toString(), error.getMessage(), "")
                        )
                );
    }
}
