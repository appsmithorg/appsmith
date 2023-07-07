package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Security;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserIdentifierService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ForkExamplesWorkspace;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationSuccessHandlerCE implements ServerAuthenticationSuccessHandler {

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    private final ForkExamplesWorkspace examplesWorkspaceCloner;
    private final RedirectHelper redirectHelper;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final UserDataService userDataService;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceService workspaceService;
    private final ApplicationPageService applicationPageService;
    private final WorkspacePermission workspacePermission;
    private final ConfigService configService;
    private final FeatureFlagService featureFlagService;
    private final CommonConfig commonConfig;

    private final UserIdentifierService userIdentifierService;

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
            // In case of OAuth2 based authentication, there is no way to identify if this was a user signup (new user
            // creation) or if this was a login (existing user). What we do here to identify this, is an approximation.
            // If and when we find a better way to do identify this, let's please move away from this approximation.
            // If the user object was created within the last 5 seconds, we treat it as a new user.
            isFromSignup = user.getCreatedAt().isAfter(Instant.now().minusSeconds(5));
            // If user has previously signed up using password and now using OAuth as a sign in method we are removing
            // form login method henceforth. This step is taken to avoid any security vulnerability in the login flow
            // as we are not verifying the user emails at first sign up. In future if we implement the email
            // verification this can be eliminated safely
            if (user.getPassword() != null) {
                user.setPassword(null);
                user.setSource(
                        LoginSource.fromString(((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId())
                );
                // Update the user in separate thread
                userRepository
                        .save(user)
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe();
            }
            if (isFromSignup) {
                boolean finalIsFromSignup = isFromSignup;
                redirectionMono = workspaceService
                        .isCreateWorkspaceAllowed(Boolean.TRUE)
                        .elapsed()
                        .map(pair -> {
                            log.debug(
                                    "AuthenticationSuccessHandlerCE::Time taken to check if workspace creation allowed: {} ms",
                                    pair.getT1());
                            return pair.getT2();
                        })
                        .flatMap(isCreateWorkspaceAllowed -> {
                            if (isCreateWorkspaceAllowed) {
                                return createDefaultApplication(defaultWorkspaceId, authentication)
                                        .elapsed()
                                        .map(pair -> {
                                            log.debug(
                                                    "AuthenticationSuccessHandlerCE::Time taken to create default application: {} ms",
                                                    pair.getT1());
                                            return pair.getT2();
                                        })
                                        .flatMap(defaultApplication -> handleOAuth2Redirect(
                                                webFilterExchange, defaultApplication, finalIsFromSignup));
                            }
                            return handleOAuth2Redirect(webFilterExchange, null, finalIsFromSignup);
                        });
            } else {
                redirectionMono = handleOAuth2Redirect(webFilterExchange, null, isFromSignup);
            }
        } else {
            boolean finalIsFromSignup = isFromSignup;
            if (createDefaultApplication && isFromSignup) {
                redirectionMono = createDefaultApplication(defaultWorkspaceId, authentication)
                        .elapsed()
                        .map(pair -> {
                            log.debug(
                                    "AuthenticationSuccessHandlerCE::Time taken to create default application: {} ms",
                                    pair.getT1());
                            return pair.getT2();
                        })
                        .flatMap(defaultApplication ->
                                redirectHelper.handleRedirect(webFilterExchange, defaultApplication, true));
            } else {
                redirectionMono = redirectHelper.handleRedirect(webFilterExchange, null, finalIsFromSignup);
            }
        }

        final boolean isFromSignupFinal = isFromSignup;
        return sessionUserService
                .getCurrentUser()
                .flatMap(currentUser -> {
                    List<Mono<?>> monos = new ArrayList<>();
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
                        monos.add(examplesWorkspaceCloner.forkExamplesWorkspace());
                    }

                    monos.add(analyticsService.sendObjectEvent(
                            AnalyticsEvents.LOGIN, currentUser, Map.of(FieldName.MODE_OF_LOGIN, modeOfLogin)));

                    return Mono.whenDelayError(monos);
                })
                .then(redirectionMono);
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

                        return userRepository
                                .findByEmail(email)
                                .flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                                .map(workspace -> {
                                    application.setWorkspaceId(workspace.getId());
                                    return application;
                                });
                    });
        }

        return applicationMono.flatMap(application1 -> applicationPageService.createApplication(application1));
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
