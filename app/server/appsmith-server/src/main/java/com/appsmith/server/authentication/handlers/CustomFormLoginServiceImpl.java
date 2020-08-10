package com.appsmith.server.authentication.handlers;

import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class CustomFormLoginServiceImpl implements ReactiveUserDetailsService {

    private UserRepository repository;

    @Autowired
    public CustomFormLoginServiceImpl(UserRepository repository) {
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
                .switchIfEmpty(Mono.error(new UsernameNotFoundException("Unable to find username: " + username)))
                .onErrorMap(error -> {
                    log.error("Can't find user {}", username);
                    return error;
                })
                // This seemingly useless call to `.map` is required to Java's type checker to compile.
                .map(user -> user);
    }
}
