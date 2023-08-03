package com.appsmith.server.authentication.managers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Component
public class ApiKeyAuthenticationManager implements ReactiveAuthenticationManager {
    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        if (Objects.nonNull(authentication)) {
            String apiKey = (String) authentication.getCredentials();
            if (StringUtils.isNotEmpty(apiKey) && Objects.nonNull(authentication.getPrincipal())) {
                User user = (User) authentication.getPrincipal();
                // Set the authenticated flag to true only when user email is not empty and the user is any user
                // other than Anonymous User, because for all the unauthenticated requests, Appsmith defaults to
                // Anonymous User.
                if (StringUtils.isNotEmpty(user.getEmail()) && !FieldName.ANONYMOUS_USER.equals(user.getEmail())) {
                    authentication.setAuthenticated(true);
                }
            }
        }
        return Mono.just(authentication);
    }
}
