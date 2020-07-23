package com.appsmith.server.helpers;

import com.appsmith.server.constants.Security;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

public class RedirectHelper {

    public static final String DEFAULT_REDIRECT_URL = "/applications";
    private static final String REDIRECT_URL_HEADER = "X-Redirect-Url";

    public static String getRedirectUrl(HttpHeaders httpHeaders) {
        // First check if the custom redirect header is set
        String redirectUrl = httpHeaders.getFirst(REDIRECT_URL_HEADER);

        // If not, then try to get the redirect URL from Origin header.
        // We append DEFAULT_REDIRECT_URL to the Origin header by default.
        if (StringUtils.isEmpty(redirectUrl) && !StringUtils.isEmpty(httpHeaders.getOrigin())) {
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
