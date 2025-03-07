package com.appsmith.server.helpers;

import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import reactor.core.publisher.Mono;

@Slf4j
public class ReactiveContextUtils {

    public static Mono<User> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> (User) auth.getPrincipal())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("No user found in the security context");
                    return Mono.empty();
                }));
    }
}
