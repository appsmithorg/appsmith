package com.appsmith.server.helpers;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.Security;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.services.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;

@Component
@RequiredArgsConstructor
public class RedirectHelper {

    public static final String DEFAULT_REDIRECT_URL = "/applications";
    public static final String SIGNUP_SUCCESS_URL = "/signup-success";
    private static final String REDIRECT_URL_HEADER = "X-Redirect-Url";
    private static final String REDIRECT_URL_QUERY_PARAM = "redirectUrl";
    private static final String FORK_APP_ID_QUERY_PARAM = "appId";

    private final ApplicationService applicationService;

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
            return Mono.just(fulfillRedirectUrl(
                    queryParams.getFirst(REDIRECT_URL_QUERY_PARAM),
                    httpHeaders
            ));

        } else if (queryParams.getFirst(FORK_APP_ID_QUERY_PARAM) != null) {
            final String forkAppId = queryParams.getFirst(FORK_APP_ID_QUERY_PARAM);
            final String defaultRedirectUrl = httpHeaders.getOrigin() + DEFAULT_REDIRECT_URL;
            return applicationService.findByClonedFromApplicationId(forkAppId, READ_APPLICATIONS)
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

    private static String fulfillRedirectUrl(String redirectUrl, HttpHeaders httpHeaders) {
        // If not, then try to get the redirect URL from Origin header.
        // We append DEFAULT_REDIRECT_URL to the Origin header by default.
        if (!StringUtils.hasText(redirectUrl)) {
            redirectUrl = DEFAULT_REDIRECT_URL;
        }

        if (!(redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://"))
                && !StringUtils.isEmpty(httpHeaders.getOrigin())) {
            redirectUrl = httpHeaders.getOrigin() + DEFAULT_REDIRECT_URL;
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
            String port = httpHeaders.getHost().getPort() != 80 ? ":" + httpHeaders.getHost().getPort() : "";
            redirectOrigin = httpHeaders.getHost().getHostName() + port;
        }

        return redirectOrigin;
    }

}
