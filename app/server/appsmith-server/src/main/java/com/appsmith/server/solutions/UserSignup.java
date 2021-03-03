package com.appsmith.server.solutions;

import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.utils.URIBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;

import static com.appsmith.server.helpers.ValidationUtils.validateEmail;
import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserSignup {

    private final UserService userService;
    private final CaptchaService captchaService;
    private final AuthenticationSuccessHandler authenticationSuccessHandler;

    private static final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    private static final WebFilterChain EMPTY_WEB_FILTER_CHAIN = serverWebExchange -> Mono.empty();

    /**
     * This function does the sign-up flow of the given user object as a new user, and then logs that user. After the
     * login is successful, the authentication success handlers will be called directly.
     * This needed to be pulled out into a separate solution class since it was creating a circular autowiring error if
     * placed inside UserService.
     * @param user User object representing the new user to be signed-up and then logged-in.
     * @param exchange ServerWebExchange object with details of the current web request.
     * @return Mono of User, published the saved user object with a non-null value for its `getId()`.
     */
    public Mono<User> signupAndLogin(User user, ServerWebExchange exchange) {

        if (!validateEmail(user.getUsername())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.EMAIL));
        }

        return Mono
                .zip(
                        userService.createUserAndSendEmail(user, exchange.getRequest().getHeaders().getOrigin()),
                        exchange.getSession(),
                        ReactiveSecurityContextHolder.getContext()
                )
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)))
                .flatMap(tuple -> {
                    final User savedUser = tuple.getT1();
                    final WebSession session = tuple.getT2();
                    final SecurityContext securityContext = tuple.getT3();

                    Authentication authentication = new UsernamePasswordAuthenticationToken(savedUser, null, savedUser.getAuthorities());
                    securityContext.setAuthentication(authentication);
                    session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, securityContext);

                    final WebFilterExchange webFilterExchange = new WebFilterExchange(exchange, EMPTY_WEB_FILTER_CHAIN);
                    return authenticationSuccessHandler
                            .onAuthenticationSuccess(webFilterExchange, authentication)
                            .thenReturn(savedUser);
                });
    }

    /**
     * Creates a new user and logs them in, with the user details taken from the POST body, read as form-data.
     * @param exchange The `ServerWebExchange` instance representing the request.
     * @return Publisher of the created user object, with an `id` value.
     */
    public Mono<Void> signupAndLoginFromFormData(ServerWebExchange exchange) {
        String recaptchaToken = exchange.getRequest().getQueryParams().getFirst("recaptchaToken");

        return captchaService.verify(recaptchaToken).flatMap(verified -> {
                  if (!verified) {
                    return Mono.error(new AppsmithException(AppsmithError.GOOGLE_RECAPTCHA_FAILED));
                  }
                  return exchange.getFormData();
                })
                .map(formData -> {
                    final User user = new User();
                    user.setEmail(formData.getFirst(FieldName.EMAIL));
                    user.setPassword(formData.getFirst("password"));
                    if (formData.containsKey(FieldName.NAME)) {
                        user.setName(formData.getFirst(FieldName.NAME));
                    }
                    if (formData.containsKey("source")) {
                        user.setSource(LoginSource.valueOf(formData.getFirst("source")));
                    }
                    if (formData.containsKey("state")) {
                        user.setState(UserState.valueOf(formData.getFirst("state")));
                    }
                    if (formData.containsKey("isEnabled")) {
                        user.setIsEnabled(Boolean.valueOf(formData.getFirst("isEnabled")));
                    }
                    return user;
                })
                .flatMap(user -> signupAndLogin(user, exchange))
                .then()
                .onErrorResume(error -> {
                    final String referer = exchange.getRequest().getHeaders().getFirst("referer");
                    final URIBuilder redirectUriBuilder = new URIBuilder(URI.create(referer)).setParameter("error", error.getMessage());
                    URI redirectUri;
                    try {
                        redirectUri = redirectUriBuilder.build();
                    } catch (URISyntaxException e) {
                        log.error("Error building redirect URI with error for signup, {}.", e.getMessage(), error);
                        redirectUri = URI.create(referer);
                    }
                    return redirectStrategy.sendRedirect(exchange, redirectUri);
                });
    }

}
