package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class SessionUserServiceImpl implements SessionUserService {

    private final UserRepository repository;

    public SessionUserServiceImpl(UserRepository userRepository) {
        this.repository = userRepository;
    }

    @Override
    public Mono<User> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(Authentication::getPrincipal)
                .flatMap(principal -> {
                    String email = "";
                    if (principal instanceof User) {
                        //Assumption that the user has inputted an email as username during user creation and not english passport name
                        email = ((User) principal).getUsername();
                    } else if (principal instanceof DefaultOAuth2User) {
                        DefaultOAuth2User defaultOAuth2User = (DefaultOAuth2User) principal;
                        email = defaultOAuth2User.getName();
                    }
                    return repository.findByEmail(email);
                });
    }
}
