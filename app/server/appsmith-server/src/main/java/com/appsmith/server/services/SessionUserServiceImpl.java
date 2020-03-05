package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class SessionUserServiceImpl implements SessionUserService {

    private final UserRepository repository;

    @Autowired
    public SessionUserServiceImpl(UserRepository userRepository) {
        this.repository = userRepository;
    }

    @Override
    public Mono<User> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    String email = "";
                    if (principal instanceof User) {
                        return Mono.just((User) principal);
                    }
                    if (principal instanceof DefaultOAuth2User) {
                        DefaultOAuth2User defaultOAuth2User = (DefaultOAuth2User) principal;
                        email = defaultOAuth2User.getName();
                    }
                    return repository.findByEmail(email);
                });
    }
}
