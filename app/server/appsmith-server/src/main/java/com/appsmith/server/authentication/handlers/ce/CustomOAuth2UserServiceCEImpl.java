package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultReactiveOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import reactor.core.publisher.Mono;

/**
 * This class is invoked for SSO logins like <strong>Github</strong> which implement the {@link OAuth2User} interface for the user.
 * We transform the {@link OAuth2User} object to {@link User} object via the {@link #loadUser(OAuth2UserRequest)}
 * We also create the user if it doesn't exist we create it via {@link #checkAndCreateUser(OAuth2User, OAuth2UserRequest)}
 */
@Slf4j
public class CustomOAuth2UserServiceCEImpl extends DefaultReactiveOAuth2UserService {

    private UserRepository repository;
    private UserService userService;

    @Autowired
    public CustomOAuth2UserServiceCEImpl(UserRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Override
    public Mono<OAuth2User> loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        Mono<OAuth2User> oauth2UserMono = super.loadUser(userRequest);

        return oauth2UserMono.flatMap(oAuth2User -> checkAndCreateUser(oAuth2User, userRequest));
    }

    /**
     * In case the user doesn't exist, create and save the user.
     */
    private Mono<User> checkAndCreateUser(OAuth2User oAuth2User, OAuth2UserRequest userRequest) {

        String username = oAuth2User.getName();

        return repository.findByEmail(username)
                .switchIfEmpty(repository.findByCaseInsensitiveEmail(username))
                .switchIfEmpty(Mono.defer(() -> {
                    User newUser = new User();
                    newUser.setName(oAuth2User.getName());
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
                });
    }
}
