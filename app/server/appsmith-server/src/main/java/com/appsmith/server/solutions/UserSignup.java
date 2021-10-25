package com.appsmith.server.solutions;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.dtos.UserSignupRequestDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.http.client.utils.URIBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.Appsmith.DEFAULT_ORIGIN_HEADER;
import static com.appsmith.server.helpers.RedirectHelper.REDIRECT_URL_QUERY_PARAM;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.validateEmail;
import static com.appsmith.server.helpers.ValidationUtils.validateLoginPassword;
import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserSignup {

    private final UserService userService;
    private final UserDataService userDataService;
    private final CaptchaService captchaService;
    private final AuthenticationSuccessHandler authenticationSuccessHandler;
    private final ConfigService configService;
    private final AnalyticsService analyticsService;
    private final PolicyUtils policyUtils;
    private final EnvManager envManager;

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

        if (!validateLoginPassword(user.getPassword())) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PASSWORD_LENGTH, LOGIN_PASSWORD_MIN_LENGTH, LOGIN_PASSWORD_MAX_LENGTH)
            );
        }

        return Mono
                .zip(
                        userService.createUserAndSendEmail(user, exchange.getRequest().getHeaders().getOrigin()),
                        exchange.getSession(),
                        ReactiveSecurityContextHolder.getContext()
                )
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)))
                .flatMap(tuple -> {
                    final User savedUser = tuple.getT1().getUser();
                    final String organizationId = tuple.getT1().getDefaultOrganizationId();
                    final WebSession session = tuple.getT2();
                    final SecurityContext securityContext = tuple.getT3();

                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                            savedUser, null, savedUser.getAuthorities()
                    );
                    securityContext.setAuthentication(authentication);
                    session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, securityContext);

                    final WebFilterExchange webFilterExchange = new WebFilterExchange(exchange, EMPTY_WEB_FILTER_CHAIN);

                    MultiValueMap<String, String> queryParams = exchange.getRequest().getQueryParams();
                    String redirectQueryParamValue = queryParams.getFirst(REDIRECT_URL_QUERY_PARAM);

                    boolean createApplication = StringUtils.isEmpty(redirectQueryParamValue) && !StringUtils.isEmpty(organizationId);
                    // need to create default application
                    return authenticationSuccessHandler
                            .onAuthenticationSuccess(webFilterExchange, authentication, createApplication, true)
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
                    if (!Boolean.TRUE.equals(verified)) {
                        return Mono.error(new AppsmithException(AppsmithError.GOOGLE_RECAPTCHA_FAILED));
                    }
                    return exchange.getFormData();
                })
                .map(formData -> {
                    final User user = new User();
                    user.setEmail(formData.getFirst(FieldName.EMAIL));
                    user.setPassword(formData.getFirst(FieldName.PASSWORD));
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
                    String referer = exchange.getRequest().getHeaders().getFirst("referer");
                    if (referer == null) {
                        referer = DEFAULT_ORIGIN_HEADER;
                    }
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

    public Mono<User> signupAndLoginSuper(UserSignupRequestDTO userFromRequest, ServerWebExchange exchange) {
        return userService.isUsersEmpty()
                .flatMap(isEmpty -> {
                    if (!Boolean.TRUE.equals(isEmpty)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    final User user = new User();
                    user.setEmail(userFromRequest.getEmail());
                    user.setName(userFromRequest.getName());
                    user.setSource(userFromRequest.getSource());
                    user.setState(userFromRequest.getState());
                    user.setIsEnabled(userFromRequest.isEnabled());
                    user.setPassword(userFromRequest.getPassword());

                    policyUtils.addPoliciesToExistingObject(Map.of(
                            AclPermission.MANAGE_INSTANCE_ENV.getValue(),
                            Policy.builder().permission(AclPermission.MANAGE_INSTANCE_ENV.getValue()).users(Set.of(user.getEmail())).build()
                    ), user);

                    return signupAndLogin(user, exchange);
                })
                .flatMap(user -> {
                    final UserData userData = new UserData();
                    userData.setRole(userFromRequest.getRole());
                    userData.setUseCase(userFromRequest.getUseCase());

                    return Mono.when(
                            userDataService.updateForUser(user, userData)
                                    .then(configService.getInstanceId())
                                    .doOnSuccess(instanceId -> {
                                        analyticsService.sendEvent(
                                                AnalyticsEvents.INSTALLATION_SETUP_COMPLETE.getEventName(),
                                                instanceId,
                                                Map.of(
                                                        "disable-telemetry", !userFromRequest.isAllowCollectingAnonymousData(),
                                                        "subscribe-marketing", userFromRequest.isSignupForNewsletter(),
                                                        "email", userFromRequest.isSignupForNewsletter() ? user.getEmail() : "",
                                                        "role", ObjectUtils.defaultIfNull(userData.getRole(), ""),
                                                        "goal", ObjectUtils.defaultIfNull(userData.getUseCase(), "")
                                                ),
                                                false
                                        );
                                        analyticsService.identifyInstance(instanceId, userData.getRole(), userData.getUseCase());
                                    }),
                            envManager.applyChanges(Map.of(
                                    "APPSMITH_DISABLE_TELEMETRY",
                                    String.valueOf(!userFromRequest.isAllowCollectingAnonymousData()),
                                    "APPSMITH_INSTANCE_NAME",
                                    "Appsmith"
                            )),
                            analyticsService.sendObjectEvent(AnalyticsEvents.CREATE_SUPERUSER, user, null)
                    ).thenReturn(user);
                });
    }

    public Mono<Void> signupAndLoginSuperFromFormData(ServerWebExchange exchange) {
        return exchange.getFormData()
                .map(formData -> {
                    final UserSignupRequestDTO user = new UserSignupRequestDTO();
                    user.setEmail(formData.getFirst(FieldName.EMAIL));
                    user.setPassword(formData.getFirst(FieldName.PASSWORD));
                    user.setSource(LoginSource.FORM);
                    user.setState(UserState.ACTIVATED);
                    user.setEnabled(true);
                    if (formData.containsKey(FieldName.NAME)) {
                        user.setName(formData.getFirst(FieldName.NAME));
                    }
                    if (formData.containsKey("role")) {
                        user.setRole(formData.getFirst("role"));
                    }
                    if (formData.containsKey("useCase")) {
                        user.setUseCase(formData.getFirst("useCase"));
                    }
                    if (formData.containsKey("allowCollectingAnonymousData")) {
                        user.setAllowCollectingAnonymousData("true".equals(formData.getFirst("allowCollectingAnonymousData")));
                    }
                    if (formData.containsKey("signupForNewsletter")) {
                        user.setSignupForNewsletter("true".equals(formData.getFirst("signupForNewsletter")));
                    }
                    return user;
                })
                .flatMap(user -> signupAndLoginSuper(user, exchange))
                .then()
                .onErrorResume(error -> {
                    String referer = exchange.getRequest().getHeaders().getFirst("referer");
                    if (referer == null) {
                        referer = DEFAULT_ORIGIN_HEADER;
                    }
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
