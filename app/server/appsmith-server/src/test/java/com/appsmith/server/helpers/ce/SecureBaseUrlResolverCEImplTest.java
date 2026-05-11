package com.appsmith.server.helpers.ce;

import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Unit tests for {@link SecureBaseUrlResolverCEImpl}.
 *
 * <p>These tests pin the fail-closed semantics added for
 * <a href="https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw">GHSA-j9gf-vw2f-9hrw</a>:
 * when {@code APPSMITH_BASE_URL} is unset, the resolver must NOT trust the request-supplied
 * {@code Origin} value as the host of token-bearing email links. It must signal "no trusted
 * URL available" via {@link reactor.core.publisher.Mono#empty()} so that callers in unauthenticated
 * flows return generic success without dispatching email (preserving anti-enumeration), while
 * callers in authenticated flows can convert the empty into an explicit configuration error.
 *
 * <p>The opt-in {@code APPSMITH_ALLOW_INSECURE_ORIGIN_BASED_LINKS} compatibility flag exists
 * solely to give operators a migration window. When enabled, it restores the legacy behavior
 * of trusting the caller-supplied value — but it does NOT weaken the strict-mode check that
 * applies once {@code APPSMITH_BASE_URL} is configured.
 */
class SecureBaseUrlResolverCEImplTest {

    private SecureBaseUrlResolverCEImpl newResolver(String configuredBaseUrl, boolean allowInsecureFallback)
            throws Exception {
        SecureBaseUrlResolverCEImpl resolver = new SecureBaseUrlResolverCEImpl();
        Field baseUrlField = SecureBaseUrlResolverCEImpl.class.getDeclaredField("appsmithBaseUrl");
        baseUrlField.setAccessible(true);
        baseUrlField.set(resolver, configuredBaseUrl == null ? "" : configuredBaseUrl);
        Field flagField = SecureBaseUrlResolverCEImpl.class.getDeclaredField("allowInsecureOriginBasedLinks");
        flagField.setAccessible(true);
        flagField.set(resolver, allowInsecureFallback);
        // Trigger the @PostConstruct hook so trailing-slash normalization runs in tests, mirroring
        // the runtime Spring lifecycle.
        resolver.init();
        return resolver;
    }

    /**
     * GHSA-j9gf-vw2f-9hrw — the central regression test. When the trusted base URL is unset and
     * the insecure compatibility flag is off (the new default), the resolver must return an
     * empty signal — NOT the caller-supplied value.
     */
    @Test
    void resolveSecureBaseUrl_whenAppsmithBaseUrlUnsetAndCompatFlagOff_returnsEmpty() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://attacker.example"))
                .verifyComplete();
    }

    /**
     * Migration path: when an operator opts into the insecure flag during a transition window,
     * the legacy behavior is restored — the caller-supplied value is returned. The WARN log is
     * the operational signal that this is happening; we do not assert on the log here, but the
     * production code MUST emit it (manual code review).
     */
    @Test
    void resolveSecureBaseUrl_whenAppsmithBaseUrlUnsetAndCompatFlagOn_returnsProvidedValue() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("", true);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://attacker.example"))
                .expectNext("https://attacker.example")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenAppsmithBaseUrlSetAndOriginMatches_returnsConfiguredUrl() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://appsmith.example"))
                .expectNext("https://appsmith.example")
                .verifyComplete();
    }

    /**
     * Regression on the protection added in PR #41426 (GHSA-7hf5-mc28-xmcv): once configured,
     * the trusted base URL must not be impersonated.
     */
    @Test
    void resolveSecureBaseUrl_whenAppsmithBaseUrlSetAndOriginMismatches_errors() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://attacker.example"))
                .verifyError(AppsmithException.class);
    }

    /**
     * Defense-in-depth: the insecure-compat flag is intended for the unset-config case only.
     * It must NOT be a backdoor that weakens strict-mode validation when APPSMITH_BASE_URL is
     * configured.
     */
    @Test
    void resolveSecureBaseUrl_whenAppsmithBaseUrlSetAndOriginMismatches_compatFlagDoesNotWeakenStrictMode()
            throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", true);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://attacker.example"))
                .verifyError(AppsmithException.class);
    }

    /**
     * Empty Origin from the request, unset config, default fail-closed: empty signal.
     * Sanity-check that the resolver does not blow up on null/empty caller-supplied values.
     */
    @Test
    void resolveSecureBaseUrl_whenProvidedBaseUrlIsNullOrBlank_andCompatFlagOff_returnsEmpty() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl(null)).verifyComplete();
        StepVerifier.create(resolver.resolveSecureBaseUrl("")).verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_constructed_isNotNull() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);
        assertNotNull(resolver);
    }

    // region URL-origin normalisation — comparison must follow RFC 6454 (scheme + host + effective port),
    // not raw string equality. Without this, real-world deployments hit spurious mismatches whenever the
    // configured value and the inbound `Origin` header differ on insignificant syntax (trailing slash,
    // default-port elision, host case). All accepted matches below resolve to the SAME origin per the
    // RFC; all rejected ones genuinely differ in scheme, host, or non-default port.

    @Test
    void resolveSecureBaseUrl_whenConfiguredHasTrailingSlash_isNormalizedAndOriginStillMatches() throws Exception {
        // Trailing slash on the configured value is stripped at @PostConstruct so that downstream
        // "%s/path" formatting in email templates does not produce "//path". The origin check
        // still tolerates the mismatched-slash inbound Origin header per RFC 6454.
        SecureBaseUrlResolverCEImpl resolver = newResolver("http://localhost/", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("http://localhost"))
                .expectNext("http://localhost")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenConfiguredHasMultipleTrailingSlashes_allAreStripped() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("http://localhost///", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("http://localhost"))
                .expectNext("http://localhost")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenConfiguredHasNoTrailingSlash_isReturnedVerbatim() throws Exception {
        // Pin the no-op path: normalization must not alter URLs that don't end in a slash.
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://appsmith.example"))
                .expectNext("https://appsmith.example")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenOriginHasTrailingSlash_andConfiguredDoesNot_match() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("http://localhost", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("http://localhost/"))
                .expectNext("http://localhost")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenOriginHasDefaultHttpPort_andConfiguredOmitsIt_match() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("http://localhost", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("http://localhost:80"))
                .expectNext("http://localhost")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenOriginHasDefaultHttpsPort_andConfiguredOmitsIt_match() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://appsmith.example:443"))
                .expectNext("https://appsmith.example")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenHostCasingDiffers_match() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://Appsmith.Example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://appsmith.example"))
                .expectNext("https://Appsmith.Example")
                .verifyComplete();
    }

    @Test
    void resolveSecureBaseUrl_whenSchemesDiffer_errors() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("http://appsmith.example"))
                .verifyError(AppsmithException.class);
    }

    @Test
    void resolveSecureBaseUrl_whenNonDefaultPortsDiffer_errors() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("http://localhost:8080", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("http://localhost:9090"))
                .verifyError(AppsmithException.class);
    }

    @Test
    void resolveSecureBaseUrl_whenOriginIsMalformed_errors() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("not a url")).verifyError(AppsmithException.class);
    }

    @Test
    void resolveSecureBaseUrl_whenAttackerUsesUserinfoTrick_errors() throws Exception {
        // Tricks like https://appsmith.example@evil.com must NOT be accepted as the same origin
        // as https://appsmith.example. URI parsing places appsmith.example in userinfo and evil.com
        // as the host — so the host comparison rejects.
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.resolveSecureBaseUrl("https://appsmith.example@evil.example"))
                .verifyError(AppsmithException.class);
    }

    // endregion

    // region isBaseUrlConfigurationHealthy — instance-config health signal driving the admin
    // warning banner. The signal answers "can this instance generate token-bearing email links
    // without depending on a request-time hint?". CE semantics: true iff APPSMITH_BASE_URL is
    // set. The insecure-flag fallback intentionally does NOT mark the instance as healthy —
    // operators who opted into the deprecated escape hatch should still see the warning so the
    // deprecation pressure is preserved.

    @Test
    void isBaseUrlConfigurationHealthy_returnsTrueWhenBaseUrlSet() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("https://appsmith.example", false);

        StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    void isBaseUrlConfigurationHealthy_returnsFalseWhenBaseUrlBlank() throws Exception {
        SecureBaseUrlResolverCEImpl resolver = newResolver("", false);

        StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
                .expectNext(false)
                .verifyComplete();
    }

    // endregion
}
