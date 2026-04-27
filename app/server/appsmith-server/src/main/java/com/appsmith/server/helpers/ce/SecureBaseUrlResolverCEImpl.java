package com.appsmith.server.helpers.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

/**
 * CE implementation of {@link SecureBaseUrlResolverCE}.
 *
 * <p>Resolution rules:
 *
 * <ol>
 *   <li>If {@code APPSMITH_BASE_URL} is configured, it is the only acceptable host. If
 *       the provided value does not match, an {@link AppsmithException} is emitted
 *       (preserves the strict-mode protection added in PR #41426 for
 *       <a href="https://github.com/appsmithorg/appsmith/security/advisories/GHSA-7hf5-mc28-xmcv">GHSA-7hf5-mc28-xmcv</a>).
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

    @Override
    public Mono<String> resolveSecureBaseUrl(String providedBaseUrl) {
        if (StringUtils.hasText(appsmithBaseUrl)) {
            if (!appsmithBaseUrl.equals(providedBaseUrl)) {
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
}
