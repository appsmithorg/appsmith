package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Slf4j
@RequiredArgsConstructor
public class SessionUserServiceCEImpl implements SessionUserServiceCE {

    private final UserRepository userRepository;

    @Override
    public Mono<User> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> (User) auth.getPrincipal());
    }

    @Override
    public Mono<User> refreshCurrentUser(ServerWebExchange exchange) {
        return Mono.zip(
                getCurrentUser().map(User::getEmail).flatMap(userRepository::findByEmail),
                ReactiveSecurityContextHolder.getContext(),
                exchange.getSession()
        ).flatMap(tuple -> {
            final User user = tuple.getT1();
            final SecurityContext context = tuple.getT2();
            final WebSession session = tuple.getT3();
            final Authentication currentToken = context.getAuthentication();
            final Authentication newToken;
            if (currentToken instanceof UsernamePasswordAuthenticationToken) {
                newToken = new UsernamePasswordAuthenticationToken(user, null, currentToken.getAuthorities());
            } else if (currentToken instanceof OAuth2AuthenticationToken) {
                newToken = new OAuth2AuthenticationToken(
                        user,
                        currentToken.getAuthorities(),
                        ((OAuth2AuthenticationToken) currentToken).getAuthorizedClientRegistrationId()
                );
            } else {
                log.error("Unrecognized session token type when updating user in session: {}.", currentToken.getClass());
                return Mono.error(new AppsmithException(AppsmithError.FAIL_UPDATE_USER_IN_SESSION));
            }
            context.setAuthentication(newToken);
            session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, context);
            return Mono.just(user);
        });
    }

}
