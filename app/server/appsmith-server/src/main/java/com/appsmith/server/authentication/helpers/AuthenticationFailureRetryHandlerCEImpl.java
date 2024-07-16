package com.appsmith.server.authentication.helpers;

import com.appsmith.server.constants.Security;
import com.appsmith.server.exceptions.AppsmithError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static com.appsmith.server.helpers.RedirectHelper.REDIRECT_URL_QUERY_PARAM;

@Slf4j
@Component
public class AuthenticationFailureRetryHandlerCEImpl implements AuthenticationFailureRetryHandlerCE {

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    protected final String LOGIN_ERROR_URL = "/user/login?error=true";
    protected final String LOGIN_ERROR_MESSAGE_URL = LOGIN_ERROR_URL + "&message=";
    protected final String SIGNUP_ERROR_URL = "/user/signup?error=";

    @Override
    public Mono<Void> retryAndRedirectOnAuthenticationFailure(
            WebFilterExchange webFilterExchange, AuthenticationException exception) {
        log.error("In the login failure handler. Cause: {}", exception.getMessage(), exception);
        ServerWebExchange exchange = webFilterExchange.getExchange();
        // On authentication failure, we send a redirect to the client's login error page. The browser will re-load the
        // login page again with an error message shown to the user.
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

    // this method extracts the origin from the referer header
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

    // this method constructs the redirect URL based on the exception type
    private String constructRedirectUrl(AuthenticationException exception, String originHeader, String redirectUrl) {
        String url = "";
        if (exception instanceof OAuth2AuthenticationException
                && AppsmithError.SIGNUP_DISABLED
                        .getAppErrorCode()
                        .toString()
                        .equals(((OAuth2AuthenticationException) exception)
                                .getError()
                                .getErrorCode())) {
            url = SIGNUP_ERROR_URL + URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
        } else {
            if (exception instanceof InternalAuthenticationServiceException) {
                url = originHeader
                        + LOGIN_ERROR_MESSAGE_URL
                        + URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
            } else {
                url = originHeader + LOGIN_ERROR_URL;
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
}
