package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.WordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import reactor.core.publisher.Mono;

@Slf4j
public class CustomFormLoginServiceCEImpl implements ReactiveUserDetailsService{

    private UserRepository repository;

    @Autowired
    public CustomFormLoginServiceCEImpl(UserRepository repository) {
        this.repository = repository;
    }

    /**
     * This function is used by {@link ReactiveUserDetailsService} in order to load the user from the DB. Will be used
     * in cases of username, password logins only. By default, the email ID is the username for the user.
     *
     * @param username
     * @return
     */
    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return repository.findByEmail(username)
                .switchIfEmpty(repository.findByCaseInsensitiveEmail(username))
                .switchIfEmpty(Mono.error(new UsernameNotFoundException("Unable to find username: " + username)))
                .onErrorMap(error -> {
                    log.error("Can't find user {}", username);
                    return error;
                })
                // This seemingly useless call to `.map` is required to Java's type checker to compile.
                .map(user -> {
                    // As this will be used for form login only, if the password field is null we can assume this login
                    // request will fail because of invalid credentials but actual reason might be user has signed up
                    // using form and then used OAuth for login which removes the password field from user object for
                    // more details refer AuthenticationSuccessHandler
                    if (user.getPassword() == null && !LoginSource.FORM.equals(user.getSource())) {
                        // We can have a implementation to give which login method user should use but this will
                        // expose the sign-in source for external world and in turn to spammers
                        throw new InternalAuthenticationServiceException(
                            AppsmithError.INVALID_LOGIN_METHOD.getMessage(
                                WordUtils.capitalize(user.getSource().toString().toLowerCase())
                            )
                        );
                    }
                    return user;
                });
    }
}
