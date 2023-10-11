package com.appsmith.server.helpers;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.Security;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class RedirectHelper {

    public static final String DEFAULT_REDIRECT_URL = "/applications";
    public static final String ERROR = "error";
    public static final String CHARACTER_QUESTION_MARK = "?";
    public static final String CHARACTER_EQUALS = "=";
    public static final String SIGNUP_SUCCESS_URL = "/signup-success";
    public static final String APPLICATION_PAGE_URL = "/applications/%s/pages/%s/edit";
    private static final String REDIRECT_URL_HEADER = "X-Redirect-Url";
    public static final String REDIRECT_URL_QUERY_PARAM = "redirectUrl";
    private static final String FORK_APP_ID_QUERY_PARAM = "appId";
    public static final String FIRST_TIME_USER_EXPERIENCE_PARAM = "enableFirstTimeUserExperience";

    private final ApplicationRepository applicationRepository;
    private final ApplicationPermission applicationPermission;
    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    /**
     * This function determines the redirect url that the browser should redirect to post-login. The priority order
     * in which these checks will be made are:
     * 1. Query parameters
     * 2. Headers
     *
     * @param request ServerHttpRequest object for the current request, used to inspect redirection details.
     * @return Publishes the redirection url as a String.
     */
    public Mono<String> getRedirectUrl(ServerHttpRequest request) {
        MultiValueMap<String, String> queryParams = request.getQueryParams();
        HttpHeaders httpHeaders = request.getHeaders();

        if (queryParams.getFirst(REDIRECT_URL_QUERY_PARAM) != null) {
            return Mono.just(fulfillRedirectUrl(queryParams.getFirst(REDIRECT_URL_QUERY_PARAM), httpHeaders));

        } else if (queryParams.getFirst(FORK_APP_ID_QUERY_PARAM) != null) {
            final String forkAppId = queryParams.getFirst(FORK_APP_ID_QUERY_PARAM);
            final String defaultRedirectUrl = httpHeaders.getOrigin() + DEFAULT_REDIRECT_URL;
            return applicationRepository
                    .findByClonedFromApplicationId(forkAppId, applicationPermission.getReadPermission())
                    .map(application -> {
                        // Get the default page in the application, or if there's no default page, get the first page
                        // in the application and redirect to edit that page.
                        String pageId = null;
                        for (final ApplicationPage page : application.getPages()) {
                            if (pageId == null || page.isDefault()) {
                                pageId = page.getId();
                            }
                            if (page.isDefault()) {
                                break;
                            }
                        }

                        if (pageId == null) {
                            return defaultRedirectUrl;
                        }

                        return httpHeaders.getOrigin()
                                + "/applications/"
                                + application.getId()
                                + "/pages/"
                                + pageId
                                + "/edit";
                    })
                    .defaultIfEmpty(defaultRedirectUrl)
                    .last();
        }

        return Mono.just(getRedirectUrlFromHeader(httpHeaders));
    }

    private static String getRedirectUrlFromHeader(HttpHeaders httpHeaders) {
        // First check if the custom redirect header is set
        String redirectUrl = fulfillRedirectUrl(httpHeaders.getFirst(REDIRECT_URL_HEADER), httpHeaders);

        // If the redirect Url is still empty, construct the redirect Url from the Referer header.
        if (StringUtils.isEmpty(redirectUrl)) {
            // If the header is still empty
            String refererHeader = httpHeaders.getFirst(Security.REFERER_HEADER);
            if (refererHeader != null && !refererHeader.isBlank()) {
                URI uri;
                try {
                    uri = new URI(refererHeader);
                    String authority = uri.getAuthority();
                    String scheme = uri.getScheme();
                    redirectUrl = scheme + "://" + authority;
                } catch (URISyntaxException e) {
                    redirectUrl = DEFAULT_REDIRECT_URL;
                }
            } else {
                redirectUrl = DEFAULT_REDIRECT_URL;
            }
        }

        return redirectUrl;
    }

    /**
     * If redirectUrl is empty, it'll be set to DEFAULT_REDIRECT_URL.
     * If the redirectUrl does not have the base url, it'll prepend that from header origin.
     *
     * @param redirectUrl
     * @param httpHeaders
     * @return
     */
    private static String fulfillRedirectUrl(String redirectUrl, HttpHeaders httpHeaders) {
        if (!StringUtils.hasText(redirectUrl)) {
            redirectUrl = DEFAULT_REDIRECT_URL;
        }

        if (!(redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://"))
                && !StringUtils.isEmpty(httpHeaders.getOrigin())) {
            redirectUrl = httpHeaders.getOrigin() + redirectUrl;
        }

        return redirectUrl;
    }

    /**
     * This function only checks the incoming request for all possible sources of a redirection domain
     * and returns with the first valid domain that it finds
     *
     * @param httpHeaders The headers received for the current request, used to inspect redirection details.
     * @return A String that represents the origin that the request came from
     */
    public String getRedirectDomain(HttpHeaders httpHeaders) {
        // This is the failsafe for when nothing could be identified
        String redirectOrigin = Appsmith.DEFAULT_ORIGIN_HEADER;

        if (!StringUtils.isEmpty(httpHeaders.getOrigin())) {
            // For PUT/POST requests or CORS?
            redirectOrigin = httpHeaders.getOrigin();
        } else if (!StringUtils.isEmpty(httpHeaders.getFirst(Security.REFERER_HEADER))) {
            // For generic web application requests
            URI uri;
            try {
                uri = new URI(httpHeaders.getFirst(Security.REFERER_HEADER));
                String authority = uri.getAuthority();
                String scheme = uri.getScheme();
                redirectOrigin = scheme + "://" + authority;
            } catch (URISyntaxException ignored) {
            }
        } else if (!StringUtils.isEmpty(httpHeaders.getHost())) {
            // For HTTP v1 requests
            String port = httpHeaders.getHost().getPort() != 80
                    ? ":" + httpHeaders.getHost().getPort()
                    : "";
            redirectOrigin = httpHeaders.getHost().getHostName() + port;
        }

        return redirectOrigin;
    }

    public String buildApplicationUrl(Application application, HttpHeaders httpHeaders) {
        String redirectUrl = RedirectHelper.DEFAULT_REDIRECT_URL;
        if (application != null
                && application.getPages() != null
                && application.getPages().size() > 0) {
            ApplicationPage applicationPage = application.getPages().get(0);
            redirectUrl =
                    String.format(RedirectHelper.APPLICATION_PAGE_URL, application.getId(), applicationPage.getId());
        }
        return fulfillRedirectUrl(redirectUrl, httpHeaders);
    }

    /**
     * Checks if the provided url is default redirect url
     *
     * @param url which needs to be checked
     * @return true if default url. false otherwise
     */
    public boolean isDefaultRedirectUrl(String url) {
        if (StringUtils.isEmpty(url)) {
            return true;
        }
        try {
            return URI.create(url).getPath().endsWith(RedirectHelper.DEFAULT_REDIRECT_URL);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public Mono<String> getAuthSuccessRedirectUrl(
            WebFilterExchange webFilterExchange, Application defaultApplication, boolean isFromSignup) {
        ServerWebExchange exchange = webFilterExchange.getExchange();
        return Mono.just(exchange.getRequest()).flatMap(this::getRedirectUrl).map(redirectUrl -> {
            String url = redirectUrl;
            if (isFromSignup) {
                boolean addFirstTimeExperienceParam = false;

                // only redirect to default application if the redirectUrl contains no other url
                if (isDefaultRedirectUrl(url) && defaultApplication != null) {
                    addFirstTimeExperienceParam = true;
                    HttpHeaders headers = exchange.getRequest().getHeaders();
                    url = this.buildApplicationUrl(defaultApplication, headers);
                }
                // This redirectUrl will be used by the client to redirect after showing a welcome page.
                url = buildSignupSuccessUrl(url, addFirstTimeExperienceParam);
            }
            return url;
        });
    }

    public Mono<Void> handleRedirect(
            WebFilterExchange webFilterExchange, Application defaultApplication, boolean isFromSignup) {
        ServerWebExchange exchange = webFilterExchange.getExchange();

        // On authentication success, we send a redirect to the client's home page. This ensures that the session
        // is set in the cookie on the browser.

        return getAuthSuccessRedirectUrl(webFilterExchange, defaultApplication, isFromSignup)
                .map(URI::create)
                .flatMap(redirectUri -> redirectStrategy.sendRedirect(exchange, redirectUri));
    }

    public String buildSignupSuccessUrl(String redirectUrl, boolean enableFirstTimeUserExperience) {
        String url = SIGNUP_SUCCESS_URL + "?redirectUrl=" + URLEncoder.encode(redirectUrl, StandardCharsets.UTF_8);
        if (enableFirstTimeUserExperience) {
            url += "&" + FIRST_TIME_USER_EXPERIENCE_PARAM + "=true";
        }
        return url;
    }

    /**
     * To build failure URL
     * @param redirectPrefix Redirect URL prefix
     * @param failureMessage Failure message to be added to redirect URL
     * @return Redirect URL
     */
    private String buildFailureUrl(String redirectPrefix, String failureMessage) {
        String url = redirectPrefix
                + CHARACTER_QUESTION_MARK
                + ERROR
                + CHARACTER_EQUALS
                + URLEncoder.encode(failureMessage, StandardCharsets.UTF_8);

        return url;
    }

    /**
     * To redirect in error cases
     * @param webFilterExchange WebFilterExchange
     * @param redirectPrefix Redirect URL prefix
     * @param failureMessage Failure message to be added to redirect URL
     * @return Mono of void
     */
    public Mono<Void> handleErrorRedirect(
            WebFilterExchange webFilterExchange, String redirectPrefix, String failureMessage) {
        ServerWebExchange exchange = webFilterExchange.getExchange();
        URI redirectURI = URI.create(buildFailureUrl(redirectPrefix, failureMessage));

        return redirectStrategy.sendRedirect(exchange, redirectURI);
    }
}
