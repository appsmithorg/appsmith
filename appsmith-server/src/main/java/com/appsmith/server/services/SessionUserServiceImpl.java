package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
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

                    // For the anonymous user, return as is. For the others return the user stored in the database.
                    if (principal instanceof User) {
                        User user = (User) principal;
                        if (user.getIsAnonymous()) {
                            return Mono.just(user);
                        } else {
                            email = user.getEmail();
                        }
                    }
                    if (principal instanceof DefaultOAuth2User) {
                        DefaultOAuth2User defaultOAuth2User = (DefaultOAuth2User) principal;
                        email = defaultOAuth2User.getName();
                    }
                    return repository.findByEmail(email, AclPermission.READ_USERS);
                });
    }
}
