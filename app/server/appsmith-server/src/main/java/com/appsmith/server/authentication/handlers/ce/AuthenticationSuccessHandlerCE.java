package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.constants.Security;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ResendEmailVerificationDTO;
import com.appsmith.server.helpers.InstanceVariablesHelper;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.helpers.WorkspaceServiceHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationSuccessHandlerCE implements ServerAuthenticationSuccessHandler {

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    private final RedirectHelper redirectHelper;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final UserDataService userDataService;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceService workspaceService;
    private final ApplicationPageService applicationPageService;
    private final WorkspacePermission workspacePermission;
    private final RateLimitService rateLimitService;
    private final OrganizationService organizationService;
    private final UserService userService;
    private final WorkspaceServiceHelper workspaceServiceHelper;
    private final InstanceVariablesHelper instanceVariablesHelper;

    private Mono<Boolean> isVerificationRequired(String userEmail, String method) {
        Mono<Boolean> emailVerificationEnabledMono =
                instanceVariablesHelper.isEmailVerificationEnabled().cache();

        Mono<User> userMono = organizationService
                .getCurrentUserOrganizationId()
                .flatMap(orgId -> userRepository.findByEmailAndOrganizationId(userEmail, orgId))
                .cache();
        Mono<Boolean> verificationRequiredMono = null;

        if ("signup".equals(method)) {
            verificationRequiredMono = emailVerificationEnabledMono.flatMap(emailVerificationEnabled -> {
                // email verification is not enabled at the org, so verification not required
                if (!TRUE.equals(emailVerificationEnabled)) {
                    return userMono.flatMap(user -> {
                        user.setEmailVerificationRequired(FALSE);
                        return userRepository.save(user).then(Mono.just(FALSE));
                    });
                } else {
                    return userMono.flatMap(user -> {
                        user.setEmailVerificationRequired(TRUE);
                        return userRepository.save(user).then(Mono.just(TRUE));
                    });
                }
            });
        } else if ("login".equals(method)) {
            verificationRequiredMono = userMono.flatMap(user -> {
                Boolean emailVerified = user.getEmailVerified();
                // email already verified
                if (TRUE.equals(emailVerified)) {
                    return Mono.just(FALSE);
                } else {
                    return emailVerificationEnabledMono.flatMap(emailVerificationEnabled -> {
                        // email verification not enabled at the org
                        if (!TRUE.equals(emailVerificationEnabled)) {
                            user.setEmailVerificationRequired(FALSE);
                            return userRepository.save(user).then(Mono.just(FALSE));
                        } else {
                            // scenario when at the time of signup, the email verification was disabled at the org
                            // but later on turned on, now when this user logs in, it will not be prompted to verify
                            // as the configuration at time of signup is considered for any user.
                            // for old users, the login works as expected, without the need to verify
                            if (!TRUE.equals(user.getEmailVerificationRequired())) {
                                return Mono.just(FALSE);
                            } else {
                                user.setEmailVerificationRequired(TRUE);
                                return userRepository.save(user).then(Mono.just(TRUE));
                            }
                        }
                    });
                }
            });
        }
        return verificationRequiredMono;
    }

    /**
     * On authentication success, we send a redirect to the endpoint that serve's the user's profile.
     * The client browser will follow this redirect and fetch the user's profile JSON from the server.
     * In the process, the client browser will also set the session ID in the cookie against the server's API domain.
     *
     * @param webFilterExchange WebFilterExchange instance for the current request.
     * @param authentication    Authentication object, needs to have a non-null principal object.
     * @return Publishes empty, that completes after handler tasks are finished.
     */
    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        return onAuthenticationSuccess(webFilterExchange, authentication, false, false, null);
    }

    private Mono<String> extractRedirectUrlAndSendVerificationMail(
            WebFilterExchange webFilterExchange, User user, String redirectUrl) {
        String baseUrl =
                webFilterExchange.getExchange().getRequest().getHeaders().getOrigin();
        ResendEmailVerificationDTO resendEmailVerificationDTO = new ResendEmailVerificationDTO();
        resendEmailVerificationDTO.setEmail(user.getEmail());
        resendEmailVerificationDTO.setBaseUrl(baseUrl);
        // This is the case post signup when the url is /signup-success?redirectUrl=<>
        // After verification we redirect the user to /signup-success always and use the redirect url
        // to navigate to next page after signup-success
        try {
            redirectUrl = redirectUrl.split("redirectUrl=")[1];
        } catch (Exception e) {
            log.error(String.valueOf(e));
        }
        redirectUrl = URLDecoder.decode(redirectUrl, StandardCharsets.UTF_8);
        return userService
                .resendEmailVerification(resendEmailVerificationDTO, redirectUrl)
                .then(Mono.just(redirectUrl));
    }

    /**
     * This function:
     * Removes the user session as only post verification login is allowed
     * Extracts the redirect url post signup/login
     * Send email verification mail with the redirect url
     * Redirects the user to verificationPending screen
     */
    private Mono<Void> postVerificationRequiredHandler(
            WebFilterExchange webFilterExchange, User user, Application defaultApplication) {
        return webFilterExchange.getExchange().getSession().flatMap(webSession -> {
            // First remove the security context from the session attributes
            webSession.getAttributes().remove(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME);
            // Then invalidate the entire session to remove it from Redis
            return webSession
                    .invalidate()
                    .then(redirectHelper
                            .getAuthSuccessRedirectUrl(webFilterExchange, defaultApplication, true)
                            .flatMap(redirectUrl -> extractRedirectUrlAndSendVerificationMail(
                                            webFilterExchange, user, redirectUrl)
                                    .map(url -> String.format(
                                            "/user/verificationPending?email=%s",
                                            URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)))
                                    .flatMap(redirectUri -> redirectStrategy.sendRedirect(
                                            webFilterExchange.getExchange(), URI.create(redirectUri)))));
        });
    }

    /**
     * This function handles the redirection in case of form type signup/login.
     * It constructs the redirect uri based on user's request, and if email verification is required
     * then redirects the user to /verificationPending and sends the magic link with the user's redirectUrl
     * in the email.
     */
    private Mono<Void> formEmailVerificationRedirectionHandler(
            WebFilterExchange webFilterExchange,
            String defaultWorkspaceId,
            Authentication authentication,
            Boolean isFromSignup,
            Boolean createDefaultApplication) {
        Mono<Void> redirectionMono;
        User user = (User) authentication.getPrincipal();
        Mono<Boolean> isVerificationRequiredMono;

        if (isFromSignup) {
            isVerificationRequiredMono = isVerificationRequired(user.getEmail(), "signup");
            if (createDefaultApplication) {
                redirectionMono = isVerificationRequiredMono.flatMap(isVerificationRequired -> {
                    if (TRUE.equals(isVerificationRequired)) {
                        return createDefaultApplication(defaultWorkspaceId, authentication)
                                .flatMap(defaultApplication ->
                                        postVerificationRequiredHandler(webFilterExchange, user, defaultApplication));
                    } else {
                        return createDefaultApplication(defaultWorkspaceId, authentication)
                                .flatMap(application ->
                                        redirectHelper.handleRedirect(webFilterExchange, application, true));
                    }
                });
            } else {
                redirectionMono = isVerificationRequiredMono.flatMap(isVerificationRequired -> {
                    if (TRUE.equals(isVerificationRequired)) {
                        return postVerificationRequiredHandler(webFilterExchange, user, null);
                    } else {
                        return redirectHelper.handleRedirect(webFilterExchange, null, true);
                    }
                });
            }
        } else {
            isVerificationRequiredMono = isVerificationRequired(user.getEmail(), "login");
            redirectionMono = isVerificationRequiredMono.flatMap(isVerificationRequired -> {
                if (TRUE.equals(isVerificationRequired)) {
                    return postVerificationRequiredHandler(webFilterExchange, user, null);
                } else {
                    return redirectHelper.handleRedirect(webFilterExchange, null, false);
                }
            });
        }
        return redirectionMono;
    }

    public Mono<Void> onAuthenticationSuccess(
            WebFilterExchange webFilterExchange,
            Authentication authentication,
            boolean createDefaultApplication,
            boolean isFromSignup,
            String defaultWorkspaceId) {
        log.debug("Login succeeded for user: {}", authentication.getPrincipal());
        Mono<Void> redirectionMono;
        User user = (User) authentication.getPrincipal();

        if (authentication instanceof OAuth2AuthenticationToken) {
            // for oauth type signups, we don't need to verify email
            user.setEmailVerificationRequired(FALSE);

            // In case of OAuth2 based authentication, there is no way to identify if this was a user signup (new user
            // creation) or if this was a login (existing user). What we do here to identify this, is an approximation.
            // If and when we find a better way to do identify this, let's please move away from this approximation.
            // If the user object was created within the last 5 seconds, we treat it as a new user.
            isFromSignup = user.getCreatedAt().isAfter(Instant.now().minusSeconds(5));

            // Check the existing login source with the authentication source and then update the login source,
            // if they are not the same.
            // Also, since this is OAuth2 authentication, we remove the password from user resource object, in order to
            // invalidate any password which may have been set during a form login.
            LoginSource authenticationLoginSource = LoginSource.fromString(
                    ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId());
            if (!authenticationLoginSource.equals(user.getSource())) {
                user.setPassword(null);
                user.setSource(authenticationLoginSource);
                // Update the user in separate thread
                userRepository
                        .save(user)
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe();
            }
            if (isFromSignup) {
                final boolean isFromSignupFinal = isFromSignup;
                redirectionMono = workspaceServiceHelper
                        .isCreateWorkspaceAllowed(TRUE)
                        .flatMap(isCreateWorkspaceAllowed -> {
                            if (isCreateWorkspaceAllowed.equals(Boolean.TRUE)) {
                                return createDefaultApplication(defaultWorkspaceId, authentication)
                                        .flatMap(application -> handleOAuth2Redirect(
                                                webFilterExchange, application, isFromSignupFinal));
                            }
                            return handleOAuth2Redirect(webFilterExchange, null, isFromSignupFinal);
                        });
            } else {
                redirectionMono = handleOAuth2Redirect(webFilterExchange, null, isFromSignup);
            }
        } else {
            // form type signup/login handler
            redirectionMono = formEmailVerificationRedirectionHandler(
                    webFilterExchange, defaultWorkspaceId, authentication, isFromSignup, createDefaultApplication);
        }

        final boolean isFromSignupFinal = isFromSignup;
        Mono<Void> finalRedirectionMono = redirectionMono;
        return sessionUserService
                .getCurrentUser()
                .flatMap(currentUser -> {
                    List<Mono<?>> monos = new ArrayList<>();

                    // Since the user has successfully logged in, lets reset the rate limit counter for the user.
                    monos.add(rateLimitService.resetCounter(
                            RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API, user.getEmail()));

                    monos.add(userDataService.ensureViewedCurrentVersionReleaseNotes(currentUser));

                    String modeOfLogin = FieldName.FORM_LOGIN;
                    if (authentication instanceof OAuth2AuthenticationToken) {
                        modeOfLogin = ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();
                    }

                    if (isFromSignupFinal) {
                        final String inviteToken = currentUser.getInviteToken();
                        final boolean isFromInvite = inviteToken != null;

                        // This should hold the role of the user, e.g., `App Viewer`, `Developer`, etc.
                        final String invitedAs =
                                inviteToken == null ? "" : inviteToken.split(":", 2)[0];

                        modeOfLogin = "FormSignUp";
                        if (authentication instanceof OAuth2AuthenticationToken) {
                            modeOfLogin =
                                    ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();
                        }

                        monos.add(analyticsService.sendObjectEvent(
                                AnalyticsEvents.FIRST_LOGIN,
                                currentUser,
                                Map.of(
                                        "isFromInvite",
                                        isFromInvite,
                                        "invitedAs",
                                        invitedAs,
                                        FieldName.MODE_OF_LOGIN,
                                        modeOfLogin)));
                    }

                    monos.add(analyticsService.sendObjectEvent(
                            AnalyticsEvents.LOGIN, currentUser, Map.of(FieldName.MODE_OF_LOGIN, modeOfLogin)));

                    return Mono.whenDelayError(monos);
                })
                .then(finalRedirectionMono);
    }

    protected Mono<Application> createDefaultApplication(String defaultWorkspaceId, Authentication authentication) {

        // need to create default application
        Application application = new Application();
        application.setWorkspaceId(defaultWorkspaceId);
        application.setName("My first application");
        Mono<Application> applicationMono = Mono.just(application);
        if (defaultWorkspaceId == null) {

            applicationMono = workspaceRepository
                    .findAll(workspacePermission.getEditPermission())
                    .take(1, true)
                    .collectList()
                    .flatMap(workspaces -> {
                        // Since this is the first application creation, the first workspace would be the only
                        // workspace user has access to, and would be user's default workspace. Hence, we use this
                        // workspace to create the application.
                        if (workspaces.size() == 1) {
                            application.setWorkspaceId(workspaces.get(0).getId());
                            return Mono.just(application);
                        }

                        // In case no workspaces are found for the user, create a new default workspace
                        String email = ((User) authentication.getPrincipal()).getEmail();

                        return organizationService
                                .getCurrentUserOrganizationId()
                                .flatMap(orgId -> userRepository.findByEmailAndOrganizationId(email, orgId))
                                .flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                                .map(workspace -> {
                                    application.setWorkspaceId(workspace.getId());
                                    return application;
                                });
                    });
        }

        return applicationMono.flatMap(applicationPageService::createApplication);
    }

    /**
     * This function redirects the back to the client's page after a successful sign in/sign up attempt by the user
     * This is to transfer control back to the client because the OAuth2 dance would have been performed by the server.
     * <p>
     * We extract the redirect url from the `state` key present in the request exchange object. This is state variable
     * contains a random generated key along with the referer header set in the
     * {@link CustomServerOAuth2AuthorizationRequestResolver#generateKey(ServerHttpRequest)} function.
     *
     * @param webFilterExchange WebFilterExchange instance for the current request.
     * @return Publishes empty after redirection has been applied to the current exchange.
     */
    @SuppressWarnings(
            // Disabling this because although the reference in the Javadoc is to a private method, it is still useful.
            "JavadocReference")
    private Mono<Void> handleOAuth2Redirect(
            WebFilterExchange webFilterExchange, Application defaultApplication, boolean isFromSignup) {
        ServerWebExchange exchange = webFilterExchange.getExchange();
        String state = exchange.getRequest().getQueryParams().getFirst(Security.QUERY_PARAMETER_STATE);
        String redirectUrl = RedirectHelper.DEFAULT_REDIRECT_URL;
        if (state != null && !state.isEmpty()) {
            String[] stateArray = state.split("@");
            for (String stateVar : stateArray) {
                if (stateVar != null && stateVar.startsWith(Security.STATE_PARAMETER_ORIGIN)) {
                    // This is the origin of the request that we want to redirect to
                    redirectUrl = stateVar.split("-", 2)[1];
                }
            }
        }

        boolean addFirstTimeExperienceParam = false;
        if (isFromSignup) {
            if (redirectHelper.isDefaultRedirectUrl(redirectUrl) && defaultApplication != null) {
                addFirstTimeExperienceParam = true;
                HttpHeaders headers = exchange.getRequest().getHeaders();
                redirectUrl = redirectHelper.buildApplicationUrl(defaultApplication, headers);
            }
            redirectUrl = redirectHelper.buildSignupSuccessUrl(redirectUrl, addFirstTimeExperienceParam);
        }

        return redirectStrategy.sendRedirect(exchange, URI.create(redirectUrl));
    }
}
