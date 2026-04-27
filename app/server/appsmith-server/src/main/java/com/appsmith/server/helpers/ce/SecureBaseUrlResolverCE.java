package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

/**
 * Resolves the trusted, server-side base URL used as the host of token-bearing
 * email links (forgot-password, email verification, workspace invite,
 * instance-admin invite).
 *
 * <p>The resolver MUST NOT trust request-supplied values such as the {@code Origin}
 * header as the canonical host. Doing so allows an unauthenticated attacker to
 * influence the link host of security-sensitive emails — see
 * <a href="https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw">GHSA-j9gf-vw2f-9hrw</a>.
 *
 * <p>Implementations return {@link Mono#empty()} when no trusted base URL can be
 * resolved and the insecure compatibility flag is off. Callers are expected to
 * translate this into a flow-appropriate response:
 * <ul>
 *   <li>For unauthenticated anti-enumeration flows (forgot password, resend
 *       verification): return a generic success response without sending email.</li>
 *   <li>For authenticated flows (workspace invite, instance-admin invite): surface
 *       a clear configuration error to the admin caller.</li>
 * </ul>
 */
public interface SecureBaseUrlResolverCE {

    /**
     * @param providedBaseUrl the base URL extracted from the inbound request (typically
     *     the {@code Origin} header). Treated as untrusted input.
     * @return a {@link Mono} emitting the resolved trusted base URL, or empty if no
     *     trusted URL can be resolved and the insecure compatibility fallback is off.
     *     May emit an error if a configured base URL is set and the provided value
     *     does not match (strict-mode enforcement, preserved from prior hardening).
     */
    Mono<String> resolveSecureBaseUrl(String providedBaseUrl);
}
