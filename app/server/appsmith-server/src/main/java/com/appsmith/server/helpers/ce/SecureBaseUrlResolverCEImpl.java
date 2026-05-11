package com.appsmith.server.helpers.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Objects;

/**
 * CE implementation of {@link SecureBaseUrlResolverCE}.
 *
 * <p>Resolution rules:
 *
 * <ol>
 *   <li>If {@code APPSMITH_BASE_URL} is configured, it is the only acceptable host. If
 *       the provided value does not match (compared by URL origin — scheme + host + effective port,
 *       per RFC 6454), an {@link AppsmithException} is emitted. This preserves the strict-mode
 *       protection added in PR #41426 for
 *       <a href="https://github.com/appsmithorg/appsmith/security/advisories/GHSA-7hf5-mc28-xmcv">GHSA-7hf5-mc28-xmcv</a>.
 *       The insecure compatibility flag does NOT weaken this branch.</li>
 *   <li>If {@code APPSMITH_BASE_URL} is unset and {@code APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS}
 *       is true, the legacy behaviour is restored: the caller-supplied value is
 *       returned. A WARN log is emitted on every call so operators are aware they
 *       are running in an insecure mode. This flag is intended only as a transition
 *       path and is documented as deprecated.</li>
 *   <li>If {@code APPSMITH_BASE_URL} is unset and the insecure flag is off (the new
 *       default), the resolver emits {@link Mono#empty()} together with a WARN log.
 *       Callers in unauthenticated flows convert this into a generic success
 *       response without dispatching email (anti-enumeration). Callers in
 *       authenticated flows convert it into an explicit configuration error.</li>
 * </ol>
 */
@Slf4j
public class SecureBaseUrlResolverCEImpl implements SecureBaseUrlResolverCE {

    @Value("${APPSMITH_BASE_URL:}")
    private String appsmithBaseUrl;

    /**
     * Opt-in escape hatch for legacy self-hosted deployments that have not yet
     * configured {@code APPSMITH_BASE_URL}. When true, the resolver falls back to
     * the caller-supplied value (the historical, insecure behaviour). Defaults to
     * false. Intended only as a temporary migration window — set
     * {@code APPSMITH_BASE_URL} to your instance's canonical URL and remove this
     * flag.
     */
    @Value("${APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS:false}")
    private boolean allowInsecureOriginBasedLinks;

    /**
     * Strip trailing slash(es) from the configured base URL once, at bean initialization, so that
     * downstream {@code "%s/path"} formatting in email templates does not produce
     * {@code "https://host//path"}. Doubled slashes are silently passed through by Caddy in the
     * standard self-hosted image and break SPA routing on the client (React-Router does not
     * collapse empty path segments). One-time normalization here avoids a class of footgun for
     * operators who copy-paste a URL ending in {@code /}.
     */
    @PostConstruct
    public void init() {
        if (StringUtils.hasText(appsmithBaseUrl)) {
            appsmithBaseUrl = appsmithBaseUrl.replaceAll("/+$", "");
        }
    }

    @Override
    public Mono<String> resolveSecureBaseUrl(String providedBaseUrl) {
        if (StringUtils.hasText(appsmithBaseUrl)) {
            if (!sameOrigin(appsmithBaseUrl, providedBaseUrl)) {
                log.warn(
                        "Origin mismatch: provided='{}' does not match configured APPSMITH_BASE_URL='{}'.",
                        providedBaseUrl,
                        appsmithBaseUrl);
                return Mono.error(new AppsmithException(
                        AppsmithError.GENERIC_BAD_REQUEST,
                        "Origin header does not match APPSMITH_BASE_URL configuration."));
            }
            return Mono.just(appsmithBaseUrl);
        }

        if (allowInsecureOriginBasedLinks) {
            log.warn("APPSMITH_BASE_URL is not configured and APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS=true. "
                    + "Token-bearing email links will be derived from the request Origin header. "
                    + "This is INSECURE and intended only as a transition path. "
                    + "Set APPSMITH_BASE_URL to your instance's canonical URL and remove the insecure flag.");
            return Mono.just(providedBaseUrl);
        }

        log.warn("APPSMITH_BASE_URL is not configured. Token-bearing email flows (password reset, "
                + "email verification, invites) are disabled until APPSMITH_BASE_URL is set. "
                + "See https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw");
        return Mono.empty();
    }

    @Override
    public Mono<Boolean> isBaseUrlConfigurationHealthy() {
        return Mono.just(StringUtils.hasText(appsmithBaseUrl));
    }

    /**
     * Compares two URLs by their origin (scheme + host + effective port) per RFC 6454, rather than
     * by raw string equality. Tolerates insignificant differences such as trailing slashes and
     * default-port elision (e.g. {@code http://example.com} and {@code http://example.com:80} are
     * the same origin) while still rejecting any difference in scheme, host, or non-default port.
     *
     * <p>Returns {@code false} for any malformed URL or null/blank input. Userinfo, path, query,
     * and fragment are deliberately ignored — only the security-relevant origin is compared.
     */
    private static boolean sameOrigin(String configured, String provided) {
        if (!StringUtils.hasText(configured) || !StringUtils.hasText(provided)) {
            return false;
        }
        try {
            URI configuredUri = new URI(configured.trim());
            URI providedUri = new URI(provided.trim());

            String configuredScheme = lowerCase(configuredUri.getScheme());
            String providedScheme = lowerCase(providedUri.getScheme());
            if (!Objects.equals(configuredScheme, providedScheme)) {
                return false;
            }

            String configuredHost = lowerCase(configuredUri.getHost());
            String providedHost = lowerCase(providedUri.getHost());
            if (configuredHost == null || !Objects.equals(configuredHost, providedHost)) {
                // Reject when host can't be parsed (e.g. opaque URIs) or hosts differ.
                return false;
            }

            return effectivePort(configuredUri) == effectivePort(providedUri);
        } catch (URISyntaxException e) {
            log.warn("Failed to parse URL for origin comparison: {}", e.getMessage());
            return false;
        }
    }

    private static int effectivePort(URI uri) {
        int port = uri.getPort();
        if (port != -1) {
            return port;
        }
        String scheme = lowerCase(uri.getScheme());
        if ("http".equals(scheme)) {
            return 80;
        }
        if ("https".equals(scheme)) {
            return 443;
        }
        return -1;
    }

    private static String lowerCase(String value) {
        return value == null ? null : value.toLowerCase(Locale.ROOT);
    }
}
