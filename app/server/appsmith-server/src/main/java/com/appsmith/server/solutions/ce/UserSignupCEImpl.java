package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserSignupRequestDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.EnvManager;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.hc.core5.net.URIBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.AnalyticsConstants.DISABLE_TELEMETRY;
import static com.appsmith.external.constants.AnalyticsConstants.GOAL;
import static com.appsmith.external.constants.AnalyticsConstants.IP;
import static com.appsmith.external.constants.AnalyticsConstants.IP_ADDRESS;
import static com.appsmith.external.constants.AnalyticsConstants.SUBSCRIBE_MARKETING;
import static com.appsmith.server.constants.Appsmith.DEFAULT_ORIGIN_HEADER;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_DISABLE_TELEMETRY;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.constants.ce.FieldNameCE.EMAIL;
import static com.appsmith.server.constants.ce.FieldNameCE.NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.ORGANIZATION;
import static com.appsmith.server.constants.ce.FieldNameCE.PROFICIENCY;
import static com.appsmith.server.constants.ce.FieldNameCE.ROLE;
import static com.appsmith.server.helpers.RedirectHelper.REDIRECT_URL_QUERY_PARAM;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.validateEmail;
import static com.appsmith.server.helpers.ValidationUtils.validateUserPassword;
import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Slf4j
public class UserSignupCEImpl implements UserSignupCE {

    private final UserService userService;
    private final UserDataService userDataService;
    private final CaptchaService captchaService;
    private final AuthenticationSuccessHandler authenticationSuccessHandler;
    private final ConfigService configService;
    private final AnalyticsService analyticsService;
    private final EnvManager envManager;
    private final UserUtils userUtils;
    private final NetworkUtils networkUtils;
    private final EmailService emailService;
    private final OrganizationService organizationService;

    private static final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    private static final WebFilterChain EMPTY_WEB_FILTER_CHAIN = serverWebExchange -> Mono.empty();

    public UserSignupCEImpl(
            UserService userService,
            UserDataService userDataService,
            CaptchaService captchaService,
            AuthenticationSuccessHandler authenticationSuccessHandler,
            ConfigService configService,
            AnalyticsService analyticsService,
            EnvManager envManager,
            UserUtils userUtils,
            NetworkUtils networkUtils,
            EmailService emailService,
            OrganizationService organizationService) {

        this.userService = userService;
        this.userDataService = userDataService;
        this.captchaService = captchaService;
        this.authenticationSuccessHandler = authenticationSuccessHandler;
        this.configService = configService;
        this.analyticsService = analyticsService;
        this.envManager = envManager;
        this.userUtils = userUtils;
        this.networkUtils = networkUtils;
        this.emailService = emailService;
        this.organizationService = organizationService;
    }

    /**
     * This function does the sign-up flow of the given user object as a new user, and then logs that user. After the
     * login is successful, the authentication success handlers will be called directly.
     * This needed to be pulled out into a separate solution class since it was creating a circular autowiring error if
     * placed inside UserService.
     *
     * @param user     User object representing the new user to be signed-up and then logged-in.
     * @param exchange ServerWebExchange object with details of the current web request.
     * @return Mono of User, published the saved user object with a non-null value for its `getId()`.
     */
    public Mono<User> signupAndLogin(User user, ServerWebExchange exchange) {

        if (!validateEmail(user.getUsername())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, EMAIL));
        }

        Mono<Organization> organizationMono = organizationService
                .getDefaultOrganization()
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, DEFAULT, ORGANIZATION)));

        // - Only creating user if the password strength is acceptable as per the organization policy
        // - Welcome email will be sent post user email verification
        Mono<UserSignupDTO> createUserMono = organizationMono.flatMap(organization -> {
            OrganizationConfiguration organizationConfiguration = organization.getOrganizationConfiguration();
            boolean isStrongPasswordPolicyEnabled = organizationConfiguration != null
                    && Boolean.TRUE.equals(organizationConfiguration.getIsStrongPasswordPolicyEnabled());

            if (!validateUserPassword(user.getPassword(), isStrongPasswordPolicyEnabled)) {
                return isStrongPasswordPolicyEnabled
                        ? Mono.error(new AppsmithException(
                                AppsmithError.INSUFFICIENT_PASSWORD_STRENGTH,
                                LOGIN_PASSWORD_MIN_LENGTH,
                                LOGIN_PASSWORD_MAX_LENGTH))
                        : Mono.error(new AppsmithException(
                                AppsmithError.INVALID_PASSWORD_LENGTH,
                                LOGIN_PASSWORD_MIN_LENGTH,
                                LOGIN_PASSWORD_MAX_LENGTH));
            }

            return userService.createUser(user).elapsed().map(pair -> {
                log.debug("UserSignupCEImpl::Time taken for create user and send email: {} ms", pair.getT1());
                return pair.getT2();
            });
        });

        return Mono.zip(createUserMono, exchange.getSession(), ReactiveSecurityContextHolder.getContext())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)))
                .flatMap(tuple -> {
                    final User savedUser = tuple.getT1().getUser();
                    final String workspaceId = tuple.getT1().getDefaultWorkspaceId();
                    final WebSession session = tuple.getT2();
                    final SecurityContext securityContext = tuple.getT3();

                    Authentication authentication =
                            new UsernamePasswordAuthenticationToken(savedUser, null, savedUser.getAuthorities());
                    securityContext.setAuthentication(authentication);
                    session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, securityContext);

                    final WebFilterExchange webFilterExchange = new WebFilterExchange(exchange, EMPTY_WEB_FILTER_CHAIN);

                    MultiValueMap<String, String> queryParams =
                            exchange.getRequest().getQueryParams();
                    String redirectQueryParamValue = queryParams.getFirst(REDIRECT_URL_QUERY_PARAM);

                    /* TODO
                      - Add testcases for SignUp service
                           - Verify that Workspace is created for the user
                           - Verify that first application is created inside created workspace when “redirectUrl” query parameter is not present in the request
                           - Verify that first application is not created when “redirectUrl” query parameter is present in the request
                    */
                    boolean createApplication =
                            StringUtils.isEmpty(redirectQueryParamValue) && !StringUtils.isEmpty(workspaceId);
                    // need to create default application
                    Mono<Integer> authenticationSuccessMono = authenticationSuccessHandler
                            .onAuthenticationSuccess(
                                    webFilterExchange, authentication, createApplication, true, workspaceId)
                            .thenReturn(1)
                            .elapsed()
                            .flatMap(pair -> {
                                log.debug(
                                        "UserSignupCEImpl::Time taken for authentication success: {} ms", pair.getT1());
                                return Mono.just(pair.getT2());
                            });
                    return authenticationSuccessMono.thenReturn(savedUser);
                });
    }

    /**
     * Creates a new user and logs them in, with the user details taken from the POST body, read as form-data.
     *
     * @param exchange The `ServerWebExchange` instance representing the request.
     * @return Publisher of the created user object, with an `id` value.
     */
    public Mono<Void> signupAndLoginFromFormData(ServerWebExchange exchange) {
        String recaptchaToken = exchange.getRequest().getQueryParams().getFirst("recaptchaToken");

        return captchaService
                .verify(recaptchaToken)
                .flatMap(verified -> {
                    if (!Boolean.TRUE.equals(verified)) {
                        return Mono.error(new AppsmithException(AppsmithError.GOOGLE_RECAPTCHA_FAILED));
                    }
                    return exchange.getFormData();
                })
                .map(formData -> {
                    final User user = new User();
                    user.setEmail(formData.getFirst(EMAIL));
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
                    String path = "/user/signup";

                    String referer = exchange.getRequest().getHeaders().getFirst("referer");
                    if (referer != null) {
                        try {
                            path = URI.create(referer).getPath();
                        } catch (IllegalArgumentException ex) {
                            // This is okay, we just use the default value for `path`.
                        }
                    }

                    URI redirectUri;
                    try {
                        redirectUri = new URIBuilder()
                                .setPath(path)
                                .setParameter("error", error.getMessage())
                                .build();
                    } catch (URISyntaxException e) {
                        log.error("Error building redirect URI with error for signup, {}.", e.getMessage(), error);
                        redirectUri = URI.create("/");
                    }
                    return redirectStrategy.sendRedirect(exchange, redirectUri);
                });
    }

    public Mono<User> signupAndLoginSuper(
            UserSignupRequestDTO userFromRequest, String originHeader, ServerWebExchange exchange) {
        Mono<User> userMono = userService
                .isUsersEmpty()
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

                    Mono<User> userMono1 = signupAndLogin(user, exchange);
                    return userMono1.elapsed().map(pair -> {
                        log.debug("UserSignupCEImpl::Time taken to complete signupAndLogin: {} ms", pair.getT1());
                        return pair.getT2();
                    });
                })
                .flatMap(user -> {
                    Mono<Boolean> makeSuperUserMono = userUtils
                            .makeSuperUser(List.of(user))
                            .elapsed()
                            .map(pair -> {
                                log.debug(
                                        "UserSignupCEImpl::Time taken to complete makeSuperUser: {} ms", pair.getT1());
                                return pair.getT2();
                            });
                    return makeSuperUserMono.thenReturn(user);
                })
                .flatMap(user -> {
                    final UserData userData = new UserData();
                    userData.setProficiency(userFromRequest.getProficiency());
                    userData.setUseCase(userFromRequest.getUseCase());

                    Mono<UserData> userDataMono = userDataService
                            .updateForUser(user, userData)
                            .elapsed()
                            .map(pair -> {
                                log.debug(
                                        "UserSignupCEImpl::Time taken to update user data for user: {} ms",
                                        pair.getT1());
                                return pair.getT2();
                            });

                    Mono<Void> applyEnvManagerChangesMono = envManager
                            .applyChanges(
                                    Map.of(
                                            APPSMITH_DISABLE_TELEMETRY.name(),
                                            String.valueOf(!userFromRequest.isAllowCollectingAnonymousData()),
                                            APPSMITH_ADMIN_EMAILS.name(),
                                            user.getEmail()),
                                    originHeader)
                            // We need a non-empty value for `.elapsed` to work.
                            .thenReturn(true)
                            .elapsed()
                            .map(pair -> {
                                log.debug("UserSignupCEImpl::Time taken to apply env changes: {} ms", pair.getT1());
                                return pair.getT2();
                            })
                            .then();

                    /*
                     * Here, we have decided to move these 2 analytics events to a separate thread.
                     * - create superuser event
                     * - installation setup event
                     * These 2 events have been put in a separate thread, because both of them don't have any impact
                     * on the user flow, but one of them (installation setup event) is causing performance impact
                     * when creating superuser (performance impact is because of an external network call in NetworkUtils.getExternalAddress()).
                     */
                    Mono<User> sendCreateSuperUserEvent = sendCreateSuperUserEventOnSeparateThreadMono(user);

                    // In the past, we have seen "Installation Setup Complete" not getting triggered if subscribed
                    // within
                    // secondary functions, hence subscribing this in a separate thread to avoid getting cancelled
                    // because
                    // of any other secondary function mono throwing an exception
                    sendInstallationSetupAnalytics(userFromRequest, user, userData)
                            .subscribeOn(LoadShifter.elasticScheduler)
                            .subscribe();

                    Mono<Long> allSecondaryFunctions = Mono.when(
                                    userDataMono, applyEnvManagerChangesMono, sendCreateSuperUserEvent)
                            .thenReturn(1L)
                            .elapsed()
                            .map(pair -> {
                                log.debug(
                                        "UserSignupCEImpl::Time taken to complete all secondary functions: {} ms",
                                        pair.getT1());
                                return pair.getT2();
                            });
                    return allSecondaryFunctions.thenReturn(user);
                });
        return userMono.elapsed().map(pair -> {
            log.debug("UserSignupCEImpl::Time taken for the user mono to complete: {} ms", pair.getT1());
            return pair.getT2();
        });
    }

    public Mono<Void> signupAndLoginSuperFromFormData(String originHeader, ServerWebExchange exchange) {
        return exchange.getFormData()
                .map(formData -> {
                    final UserSignupRequestDTO user = new UserSignupRequestDTO();
                    user.setEmail(formData.getFirst(EMAIL));
                    user.setPassword(formData.getFirst(FieldName.PASSWORD));
                    user.setSource(LoginSource.FORM);
                    user.setState(UserState.ACTIVATED);
                    user.setEnabled(true);
                    if (formData.containsKey(FieldName.NAME)) {
                        user.setName(formData.getFirst(FieldName.NAME));
                    }
                    if (formData.containsKey("proficiency")) {
                        user.setProficiency(formData.getFirst("proficiency"));
                    }
                    if (formData.containsKey("useCase")) {
                        user.setUseCase(formData.getFirst("useCase"));
                    }
                    if (formData.containsKey("allowCollectingAnonymousData")) {
                        user.setAllowCollectingAnonymousData(
                                "true".equals(formData.getFirst("allowCollectingAnonymousData")));
                    }
                    if (formData.containsKey("signupForNewsletter")) {
                        user.setSignupForNewsletter("true".equals(formData.getFirst("signupForNewsletter")));
                    }
                    return user;
                })
                .flatMap(user -> signupAndLoginSuper(user, originHeader, exchange))
                .then()
                .onErrorResume(error -> {
                    String referer = exchange.getRequest().getHeaders().getFirst("referer");
                    if (referer == null) {
                        referer = DEFAULT_ORIGIN_HEADER;
                    }
                    final URIBuilder redirectUriBuilder =
                            new URIBuilder(URI.create(referer)).setParameter("error", error.getMessage());
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

    private Mono<Void> sendInstallationSetupAnalytics(
            UserSignupRequestDTO userFromRequest, User user, UserData userData) {

        Mono<String> getInstanceIdMono = configService.getInstanceId().elapsed().map(pair -> {
            log.debug("UserSignupCEImpl::Time taken to get instance ID: {} ms", pair.getT1());
            return pair.getT2();
        });

        Mono<String> getExternalAddressMono = networkUtils
                .getExternalAddress()
                .defaultIfEmpty("unknown")
                .elapsed()
                .map(pair -> {
                    log.debug("UserSignupCEImpl::Time taken to get external address: {} ms", pair.getT1());
                    return pair.getT2();
                });

        return Mono.zip(getInstanceIdMono, getExternalAddressMono)
                .flatMap(tuple -> {
                    final String instanceId = tuple.getT1();
                    final String ip = tuple.getT2();
                    log.debug("Installation setup complete.");
                    String newsletterSignedUpUserEmail = user.getEmail();
                    String newsletterSignedUpUserName = user.getName();
                    Map<String, Object> analyticsProps = new HashMap<>();
                    analyticsProps.put(DISABLE_TELEMETRY, !userFromRequest.isAllowCollectingAnonymousData());
                    analyticsProps.put(SUBSCRIBE_MARKETING, userFromRequest.isSignupForNewsletter());
                    analyticsProps.put(EMAIL, newsletterSignedUpUserEmail);
                    analyticsProps.put(ROLE, "");
                    analyticsProps.put(PROFICIENCY, ObjectUtils.defaultIfNull(userData.getProficiency(), ""));
                    analyticsProps.put(GOAL, ObjectUtils.defaultIfNull(userData.getUseCase(), ""));
                    // ip is a reserved keyword for tracking events in Mixpanel though this is allowed in
                    // Segment. Instead of showing the ip as is Mixpanel provides derived property.
                    // As we want derived props alongwith the ip address we are sharing the ip
                    // address in separate keys
                    // Ref: https://help.mixpanel.com/hc/en-us/articles/360001355266-Event-Properties
                    analyticsProps.put(IP, ip);
                    analyticsProps.put(IP_ADDRESS, ip);
                    analyticsProps.put(NAME, ObjectUtils.defaultIfNull(newsletterSignedUpUserName, ""));

                    analyticsService.identifyInstance(
                            instanceId,
                            userData.getProficiency(),
                            userData.getUseCase(),
                            newsletterSignedUpUserEmail,
                            newsletterSignedUpUserName,
                            ip);

                    return analyticsService
                            .sendEvent(
                                    AnalyticsEvents.INSTALLATION_SETUP_COMPLETE.getEventName(),
                                    instanceId,
                                    analyticsProps,
                                    false)
                            .thenReturn(1L)
                            .elapsed()
                            .map(pair -> {
                                log.debug(
                                        "UserSignupCEImpl::Time taken to send installation setup complete analytics event: {} ms",
                                        pair.getT1());
                                return pair.getT2();
                            });
                })
                .elapsed()
                .map(pair -> {
                    log.debug(
                            "UserSignupCEImpl::Time taken to send installation setup analytics event: {} ms",
                            pair.getT1());
                    return pair.getT2();
                })
                .then();
    }

    private Mono<User> sendCreateSuperUserEventOnSeparateThreadMono(User user) {
        analyticsService
                .sendObjectEvent(AnalyticsEvents.CREATE_SUPERUSER, user, null)
                .elapsed()
                .map(pair -> {
                    log.debug("UserSignupCEImpl::Time taken to send create super user event: {} ms", pair.getT1());
                    return pair.getT2();
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();

        return Mono.just(user);
    }
}
