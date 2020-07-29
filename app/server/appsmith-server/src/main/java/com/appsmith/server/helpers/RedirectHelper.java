package com.appsmith.server.helpers;

import com.appsmith.server.constants.Security;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

public class RedirectHelper {

    public static final String DEFAULT_REDIRECT_URL = "/applications";
    private static final String REDIRECT_URL_HEADER = "X-Redirect-Url";
    private static final String REDIRECT_URL_QUERY_PARAM = "redirectUrl";

    /**
     * This function determines the redirect url that the browser should redirect to post-login. The priority order
     * in which these checks will be made are:
     * 1. Query parameters
     * 2. Headers
     *
     * @param request
     * @return
     */
    public static String getRedirectUrl(ServerHttpRequest request) {

        MultiValueMap<String, String> queryParams = request.getQueryParams();
        HttpHeaders httpHeaders = request.getHeaders();

        if (queryParams != null && queryParams.containsKey(REDIRECT_URL_QUERY_PARAM)) {
            return queryParams.getFirst(REDIRECT_URL_QUERY_PARAM);
        }
        return getRedirectUrlFromHeader(httpHeaders);
    }

    private static String getRedirectUrlFromHeader(HttpHeaders httpHeaders) {
        // First check if the custom redirect header is set
        String redirectUrl = httpHeaders.getFirst(REDIRECT_URL_HEADER);

        // If not, then try to get the redirect URL from Origin header.
        // We append DEFAULT_REDIRECT_URL to the Origin header by default.
        if (StringUtils.isEmpty(redirectUrl)) {
            redirectUrl = DEFAULT_REDIRECT_URL;
        }

        if (!(redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) && !StringUtils.isEmpty(httpHeaders.getOrigin())) {
            redirectUrl = httpHeaders.getOrigin() + DEFAULT_REDIRECT_URL;
        }

        // If the redirect Url is still empty, construct the redirect Url from the Referrer header.
        if (StringUtils.isEmpty(redirectUrl)) {
            // If the header is still empty
            String refererHeader = httpHeaders.getFirst(Security.REFERER_HEADER);
            if (refererHeader != null && !refererHeader.isBlank()) {
                URI uri = null;
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

}
