package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.Security;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ExamplesOrganizationCloner;
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
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.helpers.RedirectHelper.FIRST_TIME_USER_EXPERIENCE_PARAM;
import static com.appsmith.server.helpers.RedirectHelper.SIGNUP_SUCCESS_URL;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationSuccessHandlerCE implements ServerAuthenticationSuccessHandler {

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    private final ExamplesOrganizationCloner examplesOrganizationCloner;
    private final RedirectHelper redirectHelper;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final UserDataService userDataService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ApplicationPageService applicationPageService;

    /**
     * On authentication success, we send a redirect to the endpoint that serve's the user's profile.
     * The client browser will follow this redirect and fetch the user's profile JSON from the server.
     * In the process, the client browser will also set the session ID in the cookie against the server's API domain.
     *
     * @param webFilterExchange WebFilterExchange instance for the current request.
     * @param authentication Authentication object, needs to have a non-null principal object.
     * @return Publishes empty, that completes after handler tasks are finished.
     */
    @Override
    public Mono<Void> onAuthenticationSuccess(
            WebFilterExchange webFilterExchange,
            Authentication authentication
    ) {
        return onAuthenticationSuccess(webFilterExchange, authentication, false, false);
    }

    public Mono<Void> onAuthenticationSuccess(
            WebFilterExchange webFilterExchange,
            Authentication authentication,
            boolean createDefaultApplication,
            boolean isFromSignup
    ) {
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
                userRepository.save(user).subscribeOn(Schedulers.boundedElastic()).subscribe();
            }
            if(isFromSignup) {
                boolean finalIsFromSignup = isFromSignup;
                redirectionMono = createDefaultApplication(user)
                        .flatMap(defaultApplication->handleOAuth2Redirect(webFilterExchange, defaultApplication, finalIsFromSignup));
            } else {
                redirectionMono = handleOAuth2Redirect(webFilterExchange, null, isFromSignup);
            }
        } else {
            boolean finalIsFromSignup = isFromSignup;
            if(createDefaultApplication && isFromSignup) {
                redirectionMono = createDefaultApplication(user).flatMap(
                        defaultApplication->handleRedirect(webFilterExchange, defaultApplication, finalIsFromSignup)
                );
            } else {
                redirectionMono = handleRedirect(webFilterExchange, null, finalIsFromSignup);
            }
        }

        final boolean isFromSignupFinal = isFromSignup;
        return sessionUserService.getCurrentUser()
                .flatMap(currentUser -> {
                    List<Mono<?>> monos = new ArrayList<>();
                    monos.add(userDataService.ensureViewedCurrentVersionReleaseNotes(currentUser));

                    if (isFromSignupFinal) {
                        final String inviteToken = currentUser.getInviteToken();
                        final boolean isFromInvite = inviteToken != null;

                        // This should hold the role of the user, e.g., `App Viewer`, `Developer`, etc.
                        final String invitedAs = inviteToken == null ? "" : inviteToken.split(":", 2)[0];

                        String modeOfLogin = "FormSignUp";
                        if(authentication instanceof OAuth2AuthenticationToken) {
                            modeOfLogin = ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();
                        }

                        monos.add(analyticsService.sendObjectEvent(
                                AnalyticsEvents.FIRST_LOGIN,
                                currentUser,
                                Map.of(
                                        "isFromInvite", isFromInvite,
                                        "invitedAs", invitedAs,
                                        "modeOfLogin", modeOfLogin
                                )
                        ));
                        monos.add(examplesOrganizationCloner.cloneExamplesOrganization());
                    }

                    return Mono.whenDelayError(monos);
                })
                .then(redirectionMono);
    }

    private Mono<Application> createDefaultApplication(User user) {
        // need to create default application
        String organizationId = user.getOrganizationIds().iterator().next();

        Application application = new Application();
        application.setOrganizationId(organizationId);
        application.setName("My first application");
        return applicationPageService.createApplication(application);
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
           "JavadocReference"
    )
    private Mono<Void> handleOAuth2Redirect(WebFilterExchange webFilterExchange, Application defaultApplication, boolean isFromSignup) {
        ServerWebExchange exchange = webFilterExchange.getExchange();
        String state = exchange.getRequest().getQueryParams().getFirst(Security.QUERY_PARAMETER_STATE);
        String redirectUrl = RedirectHelper.DEFAULT_REDIRECT_URL;
        String prefix = Security.STATE_PARAMETER_ORIGIN + "=";
        if (state != null && !state.isEmpty()) {
            String[] stateArray = state.split(",");
            for (String stateVar : stateArray) {
                if (stateVar != null && stateVar.startsWith(prefix)) {
                    // This is the origin of the request that we want to redirect to
                    redirectUrl = stateVar.split("=", 2)[1];
                }
            }
        }

        boolean addFirstTimeExperienceParam = false;
        if (isFromSignup) {
            if(isDefaultRedirectUrl(redirectUrl) && defaultApplication != null) {
                addFirstTimeExperienceParam = true;
                HttpHeaders headers = exchange.getRequest().getHeaders();
                redirectUrl = redirectHelper.buildApplicationUrl(defaultApplication, headers);
            }
            redirectUrl = buildSignupSuccessUrl(redirectUrl, addFirstTimeExperienceParam);
        }

        return redirectStrategy.sendRedirect(exchange, URI.create(redirectUrl));
    }

    /**
     * Checks if the provided url is default redirect url
     * @param url which needs to be checked
     * @return true if default url. false otherwise
     */
    private boolean isDefaultRedirectUrl(String url) {
        if(StringUtils.isEmpty(url)) {
            return true;
        }
        try {
            return URI.create(url).getPath().endsWith(RedirectHelper.DEFAULT_REDIRECT_URL);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private Mono<Void> handleRedirect(WebFilterExchange webFilterExchange, Application defaultApplication, boolean isFromSignup) {
        ServerWebExchange exchange = webFilterExchange.getExchange();

        // On authentication success, we send a redirect to the client's home page. This ensures that the session
        // is set in the cookie on the browser.
        return Mono.just(exchange.getRequest())
                .flatMap(redirectHelper::getRedirectUrl)
                .map(s -> {
                    String url = s;
                    if (isFromSignup) {
                        boolean addFirstTimeExperienceParam = false;

                        // only redirect to default application if the redirectUrl contains no other url
                        if(isDefaultRedirectUrl(url) && defaultApplication != null) {
                            addFirstTimeExperienceParam = true;
                            HttpHeaders headers = exchange.getRequest().getHeaders();
                            url = redirectHelper.buildApplicationUrl(defaultApplication, headers);
                        }
                        // This redirectUrl will be used by the client to redirect after showing a welcome page.
                        url = buildSignupSuccessUrl(url, addFirstTimeExperienceParam);
                    }
                    return url;
                })
                .map(URI::create)
                .flatMap(redirectUri -> redirectStrategy.sendRedirect(exchange, redirectUri));
    }

    private String buildSignupSuccessUrl(String redirectUrl, boolean enableFirstTimeUserExperience) {
        String url = SIGNUP_SUCCESS_URL + "?redirectUrl=" + URLEncoder.encode(redirectUrl, StandardCharsets.UTF_8);
        if(enableFirstTimeUserExperience) {
            url += "&" + FIRST_TIME_USER_EXPERIENCE_PARAM + "=true";
        }
        return url;
    }
}
