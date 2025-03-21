package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exceptions.AppsmithOAuth2AuthenticationException;
import com.appsmith.server.helpers.UserOrganizationHelper;
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
    private UserOrganizationHelper userOrganizationHelper;

    @Autowired
    public CustomOidcUserServiceCEImpl(
            UserRepository repository, UserService userService, UserOrganizationHelper userOrganizationHelper) {
        this.repository = repository;
        this.userService = userService;
        this.userOrganizationHelper = userOrganizationHelper;
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

        return this.findByUsername(username)
                .switchIfEmpty(Mono.defer(() -> {
                    User newUser = new User();
                    if (oidcUser.getUserInfo() != null) {
                        newUser.setName(oidcUser.getUserInfo().getFullName());
                    } else {
                        newUser.setName(oidcUser.getName());
                    }
                    newUser.setEmail(username);
                    LoginSource loginSource = LoginSource.fromString(
                            userRequest.getClientRegistration().getRegistrationId());
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
                        // Throwing an AppsmithOAuth2AuthenticationException in case of an AppsmithException
                        // This is to differentiate between Appsmith exceptions and OAuth2 exceptions
                        error -> new AppsmithOAuth2AuthenticationException(
                                new OAuth2Error(error.getAppErrorCode().toString(), error.getMessage(), "")));
    }

    protected Mono<User> findByUsername(String email) {
        return userOrganizationHelper.getCurrentUserOrganizationId().flatMap(organizationId -> {
            return repository
                    .findByEmailAndOrganizationId(email, organizationId)
                    .switchIfEmpty(repository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                            email, organizationId));
        });
    }
}
