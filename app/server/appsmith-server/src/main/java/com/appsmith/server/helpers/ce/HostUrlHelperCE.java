package com.appsmith.server.helpers.ce;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;

import static com.google.common.net.HttpHeaders.FORWARDED;
import static com.google.common.net.HttpHeaders.X_FORWARDED_HOST;
import static com.google.common.net.HttpHeaders.X_FORWARDED_PROTO;

@Slf4j
public class HostUrlHelperCE {

    @Value("${appsmith.domain:}")
    private String configuredRedirectDomain;

    @Value("${APPSMITH_BASE_URL:}")
    private String configuredBaseUrl;

    public static final String APPSMITH_FORWARDED_HOST = "appsmith-forwarded-host";
    public static final String APPSMITH_FORWARDED_PROTO = "appsmith-forwarded-proto";

    /**
     * Resolve the client facing base URL for the current request.
     * <p>
     * The method first prefers the {@code APPSMITH_BASE_URL} environment variable to ensure that an operator supplied
     * canonical URL is always respected. When that variable is not configured, it derives the host from the incoming
     * request metadata (forwarded headers, host header etc). The {@code Origin} header is deliberately ignored for
     * deriving the base URL because it is supplied by the client and can be trivially spoofed. Instead, we only log the
     * {@code Origin} value when it disagrees with the derived host to aid troubleshooting.
     *
     * @param originInHeader origin header value supplied by the client, used solely for logging discrepancies
     * @param exchange       current request exchange used to derive request based host details
     * @return canonical base URL that should be used when communicating with the client. Returns an empty string when
     *         it cannot be determined.
     */
    public String getClientFacingBaseUrl(String originInHeader, ServerWebExchange exchange) {
        String derivedHost;

        if (StringUtils.hasText(configuredBaseUrl)) {
            derivedHost = sanitizeConfiguredDomain(configuredBaseUrl, exchange);
        } else {
            derivedHost = getHostUrl(exchange.getRequest());
        }

        if (!StringUtils.hasText(derivedHost)) {
            log.warn("Unable to determine client facing host from configured base URL or request headers");
            derivedHost = "";
        }

        // Log mismatch only when both values are present and not equal
        if (StringUtils.hasText(originInHeader)
                && StringUtils.hasText(derivedHost)
                && !originInHeader.equalsIgnoreCase(derivedHost)) {
            log.warn(
                    "Origin header and derived host mismatch; origin in header: {}, derived host: {}",
                    originInHeader,
                    derivedHost);
        }

        return derivedHost;
    }

    public static String getHostUrl(ServerHttpRequest request) {
        HttpHeaders headers = request.getHeaders();
        String hostUrl = null;

        String query = request.getURI().getQuery();
        // Check for appsmith-forwarded parameters in query string
        // This is done so that we only check for the query parameter when the request is for the OAuth2 login
        if (request.getURI().toString().contains("/login/oauth2/code/google") && query != null && !query.isEmpty()) {
            String hostFromQuery = getHostUrlFromQuery(query);
            if (hostFromQuery != null) {
                log.info("Using host URL from query parameters: {}", hostFromQuery);
                return hostFromQuery;
            }
        }

        // Prefer Forwarded header (RFC 7239)
        String forwarded = headers.getFirst(FORWARDED);
        if (forwarded != null) {
            try {
                if (forwarded.contains("host=")) {
                    hostUrl = forwarded.split("host=")[1].split("[;,]")[0].trim();
                    log.trace("Using Forwarded header host: {}", hostUrl);
                    return ensureScheme(hostUrl, request);
                }
            } catch (Exception e) {
                log.debug("Failed to parse Forwarded header: {}", forwarded, e);
            }
        }

        // Use X-Forwarded-Host if available
        String xForwardedHost = headers.getFirst(X_FORWARDED_HOST);
        if (xForwardedHost != null) {
            String scheme = headers.getFirst(X_FORWARDED_PROTO);
            if (scheme == null) {
                scheme = request.getURI().getScheme();
            }
            hostUrl = scheme + "://" + xForwardedHost;
            log.trace("Using X-Forwarded-Host: {}", hostUrl);
            return hostUrl;
        }

        // Fall back to standard Host header
        String host = headers.getFirst(HttpHeaders.HOST);
        if (host != null) {
            String scheme = request.getURI().getScheme();
            hostUrl = scheme + "://" + host;
            log.trace("Using standard Host header: {}", hostUrl);
            return hostUrl;
        }

        log.debug("No host information found in request headers");
        return null;
    }

    private static String ensureScheme(String hostUrl, ServerHttpRequest request) {
        if (!hostUrl.contains("://")) {
            String scheme = request.getHeaders().getFirst(X_FORWARDED_PROTO);
            if (scheme == null) {
                scheme = request.getURI().getScheme();
            }
            return scheme + "://" + hostUrl;
        }
        return hostUrl;
    }

    public static boolean isSecureScheme(ServerWebExchange exchange) {
        String scheme = exchange.getRequest().getHeaders().getFirst(X_FORWARDED_PROTO);
        if (scheme == null) {
            scheme = exchange.getRequest().getURI().getScheme();
        }
        return "https".equals(scheme);
    }

    /**
     * Extract host URL from query parameters if they contain appsmith-forwarded-host and appsmith-forwarded-proto
     * @param query The query string to parse
     * @return The host URL constructed from query parameters, or null if parameters not found
     */
    private static String getHostUrlFromQuery(String query) {
        String host = null;
        String proto = null;

        // Parse the query string
        String[] params = query.split("&");
        for (String param : params) {
            if (param.startsWith(APPSMITH_FORWARDED_HOST + "=")) {
                host = param.substring(APPSMITH_FORWARDED_HOST.length() + 1);
            } else if (param.startsWith(APPSMITH_FORWARDED_PROTO + "=")) {
                proto = param.substring(APPSMITH_FORWARDED_PROTO.length() + 1);
            }

            // If we have both parameters, we can return the host URL
            if (host != null && proto != null) {
                return proto + "://" + host;
            }
        }

        return null;
    }

    private static String sanitizeConfiguredDomain(String domain, ServerWebExchange exchange) {
        String sanitizedDomain = domain;
        while (sanitizedDomain.endsWith("/")) {
            sanitizedDomain = sanitizedDomain.substring(0, sanitizedDomain.length() - 1);
        }

        if (sanitizedDomain.startsWith("http://") || sanitizedDomain.startsWith("https://")) {
            return sanitizedDomain;
        }

        String scheme = exchange.getRequest().getHeaders().getFirst(X_FORWARDED_PROTO);
        if (!StringUtils.hasText(scheme)) {
            scheme = exchange.getRequest().getURI().getScheme();
        }
        if (!StringUtils.hasText(scheme)) {
            scheme = "https";
        }

        return scheme + "://" + sanitizedDomain;
    }
}
