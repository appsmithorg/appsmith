package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;

import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Slf4j
@RequiredArgsConstructor
public class SessionUserServiceCEImpl implements SessionUserServiceCE {

    private final UserRepository userRepository;
    private final ReactiveRedisOperations<String, Object> redisOperations;

    public static final String SPRING_SESSION_PATTERN = "spring:session:sessions:*";
    private static final String SESSION_ATTRIBUTE = "sessionAttr:";

    @Override
    public Mono<User> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> (User) auth.getPrincipal());
    }

    @Override
    public Mono<User> refreshCurrentUser(ServerWebExchange exchange) {
        return Mono.zip(
                        getCurrentUser()
                                .flatMap(sessionUser -> userRepository.findByEmailAndOrganizationId(
                                        sessionUser.getEmail(), sessionUser.getOrganizationId())),
                        ReactiveSecurityContextHolder.getContext(),
                        exchange.getSession())
                .flatMap(tuple -> {
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
                                ((OAuth2AuthenticationToken) currentToken).getAuthorizedClientRegistrationId());
                        // Here also update the userdata to contain the new access token.
                    } else {
                        log.error(
                                "Unrecognized session token type when updating user in session: {}.",
                                currentToken.getClass());
                        return Mono.error(new AppsmithException(AppsmithError.FAIL_UPDATE_USER_IN_SESSION));
                    }
                    context.setAuthentication(newToken);
                    session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, context);
                    return Mono.just(user);
                });
    }

    @Override
    public Mono<Void> logoutAllSessions(String email) {
        return getSessionKeysByUserEmail(email)
                .flatMap(this::deleteSessionsByKeys)
                .then();
    }

    /**
     * This method returns a list of session keys, for the given user email.
     * @param email The email of the user whose sessions keys should be fetched.
     * @return      A Mono of list of session keys.
     */
    @Override
    public Mono<List<String>> getSessionKeysByUserEmail(String email) {
        // This pattern string comes from calling `ReactiveRedisSessionRepository.getSessionKey("*")` private method.
        return getSessionKeysWithUserSessions()
                // Now we have tuples of session keys, and the corresponding user objects.
                // Filter the ones we need to clear out.
                .filter(tuple ->
                        StringUtils.equalsIgnoreCase(email, tuple.getT2().getEmail()))
                .map(Tuple2::getT1)
                .collectList();
    }

    /**
     * This method returns a Flux of tuples, where the first element is the session key, and the second element is the
     * corresponding User object.
     */
    public Flux<Tuple2<String, User>> getSessionKeysWithUserSessions() {
        return redisOperations
                .keys(SPRING_SESSION_PATTERN)
                .flatMap(key -> Mono.zip(
                        Mono.just(key),
                        // The values are maps, containing various pieces of session related information.
                        // One of them, holds the serialized User object. We want just that.
                        redisOperations
                                .opsForHash()
                                .entries(key)
                                .filter(e -> e.getValue() != null
                                        && (SESSION_ATTRIBUTE + DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME)
                                                .equals(e.getKey()))
                                .map(e -> (User) ((SecurityContext) e.getValue())
                                        .getAuthentication()
                                        .getPrincipal())
                                .next()));
    }

    @Override
    public Mono<Long> deleteSessionsByKeys(List<String> keys) {
        return CollectionUtils.isNullOrEmpty(keys)
                ? Mono.just(0L)
                : redisOperations
                        .delete(keys.toArray(String[]::new))
                        .doOnError(error -> log.error("Error clearing user sessions", error));
    }
}
