package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.constants.ApiConstants;
import com.appsmith.server.constants.Security;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static com.appsmith.server.helpers.RedirectHelper.REDIRECT_URL_QUERY_PARAM;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationFailureHandlerCE implements ServerAuthenticationFailureHandler {

    private ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    private final RateLimitService rateLimitService;
    private final SessionUserService sessionUserService;

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        log.error("In the login failure handler. Cause: {}", exception.getMessage(), exception);
        ServerWebExchange exchange = webFilterExchange.getExchange();

        String apiIdentifier = "authentication";
        Mono<String> userEmailMono = getUserEmailFromSecurityContext();
        Mono<Boolean> isRateLimitedMono =
                userEmailMono.flatMap(userEmail -> rateLimitService.tryIncreaseCounter(apiIdentifier, userEmail));

        return isRateLimitedMono.flatMap(isRateLimited -> {
            if (isRateLimited) {
                log.error("Rate limit exceeded. Redirecting to login page.");
                return handleRateLimitExceeded(exchange);
            } else {
                log.error("Rate limit not exceeded. handling authentication failure.");
                return handleAuthenticationFailure(exchange, exception);
            }
        });
    }

    private Mono<Void> handleRateLimitExceeded(ServerWebExchange exchange) {
        // Set the error in the URL query parameter for rate limiting
        String url = "/user/login?error=true&message="
                + URLEncoder.encode(ApiConstants.RATE_LIMIT_EXCEEDED_ERROR, StandardCharsets.UTF_8);
        return redirectWithUrl(exchange, url);
    }

    private Mono<Void> handleAuthenticationFailure(ServerWebExchange exchange, AuthenticationException exception) {
        MultiValueMap<String, String> queryParams = exchange.getRequest().getQueryParams();
        String state = queryParams.getFirst(Security.QUERY_PARAMETER_STATE);
        String originHeader = "/";
        String redirectUrl = queryParams.getFirst(REDIRECT_URL_QUERY_PARAM);

        if (state != null && !state.isEmpty()) {
            originHeader = getOriginFromState(state);
        } else {
            originHeader =
                    getOriginFromReferer(exchange.getRequest().getHeaders().getOrigin());
        }

        // Construct the redirect URL based on the exception type
        String url = constructRedirectUrl(exception, originHeader, redirectUrl);

        return redirectWithUrl(exchange, url);
    }

    private String getOriginFromState(String state) {
        String[] stateArray = state.split(",");
        for (int i = 0; i < stateArray.length; i++) {
            String stateVar = stateArray[i];
            if (stateVar != null && stateVar.startsWith(Security.STATE_PARAMETER_ORIGIN) && stateVar.contains("=")) {
                return stateVar.split("=")[1];
            }
        }
        return "/";
    }

    private String getOriginFromReferer(String refererHeader) {
        if (refererHeader != null && !refererHeader.isBlank()) {
            try {
                URI uri = new URI(refererHeader);
                String authority = uri.getAuthority();
                String scheme = uri.getScheme();
                return scheme + "://" + authority;
            } catch (URISyntaxException e) {
                return "/";
            }
        }
        return "/";
    }

    private String constructRedirectUrl(AuthenticationException exception, String originHeader, String redirectUrl) {
        String url = "";
        if (exception instanceof OAuth2AuthenticationException
                && AppsmithError.SIGNUP_DISABLED
                        .getAppErrorCode()
                        .toString()
                        .equals(((OAuth2AuthenticationException) exception)
                                .getError()
                                .getErrorCode())) {
            url = "/user/signup?error=" + URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
        } else {
            if (exception instanceof InternalAuthenticationServiceException) {
                url = originHeader + "/user/login?error=true&message="
                        + URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
            } else {
                url = originHeader + "/user/login?error=true";
            }
        }
        if (redirectUrl != null && !redirectUrl.trim().isEmpty()) {
            url = url + "&" + REDIRECT_URL_QUERY_PARAM + "=" + redirectUrl;
        }
        return url;
    }

    private Mono<Void> redirectWithUrl(ServerWebExchange exchange, String url) {
        URI defaultRedirectLocation = URI.create(url);
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }

    private Mono<String> getUserEmailFromSecurityContext() {
        return ReactiveSecurityContextHolder.getContext()
                .doOnNext(context -> log.debug("Got security context: {}", context))
                .map(SecurityContext::getAuthentication)
                .doOnNext(authentication -> log.debug("Got authentication: {}", authentication))
                .map(Authentication::getPrincipal) // Get Principal without typecasting
                .doOnNext(principal -> log.debug("Got principal: {}", principal))
                .map(principal -> {
                    if (principal instanceof User) {
                        return ((User) principal).getEmail();
                    } else {
                        return "Unknown";
                    }
                })
                .doOnNext(email -> log.debug("Got email: {}", email));
    }
}
