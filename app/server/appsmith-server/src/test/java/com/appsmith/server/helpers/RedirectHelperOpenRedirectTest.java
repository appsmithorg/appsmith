package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;

import java.net.InetSocketAddress;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for open redirect prevention in RedirectHelper.
 *
 * The isSafeRedirectUrl() method ensures that absolute redirect URLs
 * only point to the same origin as the request, preventing attackers
 * from crafting login links that redirect authenticated users to
 * malicious domains.
 */
class RedirectHelperOpenRedirectTest {

    private HttpHeaders headersWithOrigin(String origin) {
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin(origin);
        return headers;
    }

    // --- isSafeRedirectUrl tests ---

    @Test
    void testRelativeUrlIsAlwaysSafe() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("/applications", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("/applications/123/pages/456/edit", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("/signup-success?redirectUrl=%2Fapplications", headers));
    }

    @Test
    void testNullAndEmptyUrlIsSafe() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl(null, headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("  ", headers));
    }

    @Test
    void testSameOriginAbsoluteUrlIsSafe() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
        assertTrue(
                RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications/123/pages/456/edit", headers));
    }

    @Test
    void testSameOriginWithPortIsSafe() {
        HttpHeaders headers = headersWithOrigin("http://localhost:8080");
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://localhost:8080/applications", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://localhost:8080/applications/123", headers));
    }

    @Test
    void testDifferentHostIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com/phish", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://attacker.org/steal-cookies", headers));
    }

    @Test
    void testDifferentPortIsBlocked() {
        HttpHeaders headers = headersWithOrigin("http://localhost:8080");
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://localhost:9090/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://localhost:3000/applications", headers));
    }

    @Test
    void testSubdomainMismatchIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.appsmith.com/phish", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://appsmith.com/applications", headers));
    }

    @Test
    void testAbsoluteUrlWithNoOriginAndNoHostIsBlocked() {
        HttpHeaders headers = new HttpHeaders(); // no Origin, no Host, no X-Forwarded-Host
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com/phish", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testRelativeUrlWithNoOriginHeaderIsSafe() {
        HttpHeaders headers = new HttpHeaders(); // no Origin header
        assertTrue(RedirectHelper.isSafeRedirectUrl("/applications", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("/applications/123/pages/456/edit", headers));
    }

    // --- Origin-absent fallback path (top-level GET navigations omit Origin) ---

    @Test
    void testSameHostViaHostHeaderIsSafe() {
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/app/abc/page-id", headers));
    }

    @Test
    void testSameHostViaXForwardedHostIsSafe() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Host", "app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/app/abc/page-id", headers));
    }

    @Test
    void testXForwardedHostWinsOverHost() {
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("internal.lb", 0));
        headers.set("X-Forwarded-Host", "app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
        // The Host value must not be honored when X-Forwarded-Host disagrees.
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://internal.lb/applications", headers));
    }

    @Test
    void testXForwardedHostCommaSeparatedTakesFirst() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Host", "app.appsmith.com, internal.lb");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://internal.lb/applications", headers));
    }

    @Test
    void testXForwardedHostWithPortIsMatched() {
        // A port embedded in X-Forwarded-Host is honored: the redirect must target the
        // same port, and a redirect to a different port on the same host is rejected.
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Host", "app.appsmith.com:8443");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:8443/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testSameHostDifferentPortBlockedInFallbackPath() {
        // Origin absent, request host has no explicit port (implicit 443 for https);
        // a redirect to another port on the same host points at a different service.
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:8443/applications", headers));
    }

    @Test
    void testHostHeaderWithExplicitPortIsMatched() {
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 8443));
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:8443/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testXForwardedPortIsUsedForPortComparison() {
        // Proxies typically place the client-facing port in X-Forwarded-Port rather than
        // embedding it in X-Forwarded-Host.
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Host", "app.appsmith.com");
        headers.set("X-Forwarded-Port", "8443");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:8443/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testXForwardedPortHonoredWithoutXForwardedHost() {
        // Proxy preserves Host (so the host comes from there) but conveys the
        // client-facing port only via X-Forwarded-Port.
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));
        headers.set("X-Forwarded-Port", "8443");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:8443/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testExplicitDefaultPortMatchesImplicitPortInFallbackPath() {
        // Request host carries no port (implicit 443); redirect to :443 must still match.
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Host", "app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:443/applications", headers));
    }

    @Test
    void testDifferentHostBlockedViaHostFallback() {
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com/phish", headers));
    }

    @Test
    void testUserInfoBlockedInFallbackPath() {
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com@app.appsmith.com/", headers));
    }

    @Test
    void testProtocolRelativeBlockedInFallbackPath() {
        HttpHeaders headers = new HttpHeaders();
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));
        assertFalse(RedirectHelper.isSafeRedirectUrl("//evil.com/path", headers));
    }

    @Test
    void testIPv6HostInXForwardedHostStripsBrackets() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Host", "[::1]:8080");
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://[::1]:8080/applications", headers));
    }

    @Test
    void testMalformedUrlIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com:not-a-port/phish", headers));
    }

    @Test
    void testCaseInsensitiveHostComparison() {
        HttpHeaders headers = headersWithOrigin("https://App.Appsmith.COM");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://APP.APPSMITH.COM/applications", headers));
    }

    @Test
    void testSchemeDowngradeIsAllowed() {
        // If origin is https but redirect is http to same host, the host check passes.
        // The scheme mismatch is not a security concern for open redirect prevention.
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://app.appsmith.com/applications", headers));
    }

    @Test
    void testExplicitDefaultPortMatchesImplicitPort() {
        // https://app.com:443 should match https://app.com (port 443 is default for https)
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com:443/applications", headers));

        // http://localhost:80 should match http://localhost (port 80 is default for http)
        HttpHeaders headers2 = headersWithOrigin("http://localhost");
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://localhost:80/applications", headers2));
    }

    // --- sanitizeRedirectUrl tests ---

    @Test
    void testSanitizePassesSafeUrl() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertEquals(
                "https://app.appsmith.com/applications/123",
                RedirectHelper.sanitizeRedirectUrl("https://app.appsmith.com/applications/123", headers));
    }

    @Test
    void testSanitizeBlocksExternalUrl() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        String result = RedirectHelper.sanitizeRedirectUrl("https://evil.com/phish", headers);
        assertEquals("https://app.appsmith.com/applications", result);
    }

    @Test
    void testSanitizePassesRelativeUrl() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertEquals("/applications/123", RedirectHelper.sanitizeRedirectUrl("/applications/123", headers));
    }

    @Test
    void testSanitizeWithNoOriginFallsBackToDefault() {
        HttpHeaders headers = new HttpHeaders();
        String result = RedirectHelper.sanitizeRedirectUrl("https://evil.com/phish", headers);
        assertEquals("/applications", result);
    }

    // --- Common bypass attempts ---

    @ParameterizedTest
    @CsvSource({
        "https://evil.com@app.appsmith.com/",
        "https://app.appsmith.com.evil.com/",
        "https://evil.com/app.appsmith.com",
        "https://evil.com#@app.appsmith.com",
        "//evil.com/path",
        "//evil.com",
    })
    void testCommonBypassAttemptsAreBlocked(String maliciousUrl) {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(
                RedirectHelper.isSafeRedirectUrl(maliciousUrl, headers),
                "Should block bypass attempt: " + maliciousUrl);
    }

    // --- Dangerous scheme tests ---
    // javascript:, data:, and other non-http schemes are blocked outright.
    // Only /path relative URLs and http(s) absolute URLs are allowed.

    @Test
    void testJavascriptSchemeIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("javascript:alert(1)", headers));
    }

    @Test
    void testDataSchemeIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("data:text/html,<script>alert(1)</script>", headers));
    }

    @Test
    void testBarePathWithoutSlashIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // Bare paths like "applications" (no leading /) are rejected
        assertFalse(RedirectHelper.isSafeRedirectUrl("applications", headers));
    }

    @Test
    void testSanitizeBlocksProtocolRelativeUrl() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        String result = RedirectHelper.sanitizeRedirectUrl("//evil.com/path", headers);
        assertEquals("https://app.appsmith.com/applications", result);
    }

    // --- Additional edge-case bypass attempts ---

    @ParameterizedTest
    @CsvSource({
        "HTTP://evil.com/phish",
        "HTTPS://evil.com/phish",
        "HtTp://evil.com/phish",
    })
    void testUppercaseSchemesAreBlocked(String url) {
        // Our startsWith check is intentionally case-sensitive; non-lowercase schemes are rejected.
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl(url, headers), "Should block uppercase scheme: " + url);
    }

    @ParameterizedTest
    @CsvSource({
        "///evil.com/path",
        "////evil.com/path",
    })
    void testTripleAndQuadSlashAreBlocked(String url) {
        // Multiple leading slashes should not bypass protocol-relative URL detection.
        // ///evil.com starts with // so it is rejected, and //// likewise.
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl(url, headers), "Should block multi-slash: " + url);
    }

    @Test
    void testBackslashConfusionIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // Backslash-based bypass attempts — not starting with http:// or https://, so rejected.
        assertFalse(RedirectHelper.isSafeRedirectUrl("https:\\\\evil.com", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("http:\\\\evil.com", headers));
    }

    @Test
    void testSchemeDowngradeWithExplicitPortIsBlocked() {
        // http://host:80 vs https://host — one port is explicit, so normalize per scheme.
        // normalizePort(http, 80)=80, normalizePort(https, -1)=443 → different → blocked.
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://app.appsmith.com:80/applications", headers));
    }

    @Test
    void testSchemeUpgradeIsAllowed() {
        // http origin, https redirect — same host, both implicit ports → allowed.
        HttpHeaders headers = headersWithOrigin("http://app.appsmith.com");
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testIPAddressHostMatchIsSafe() {
        HttpHeaders headers = headersWithOrigin("http://127.0.0.1:8080");
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://127.0.0.1:8080/applications", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://127.0.0.2:8080/applications", headers));
    }

    @Test
    void testEmptyAuthorityIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // https:///path has empty authority — host will be null, so blocked.
        assertFalse(RedirectHelper.isSafeRedirectUrl("https:///path", headers));
    }

    // --- URL encoding bypass attempts ---

    @ParameterizedTest
    @CsvSource({
        "%2F%2Fevil.com",
        "%2f%2fevil.com",
        "%2F%2Fevil.com/path",
    })
    void testUrlEncodedDoubleSlashIsBlocked(String url) {
        // URL-encoded // should not bypass the protocol-relative check.
        // Java's URI parser does NOT decode %2F, so these become opaque paths
        // that don't start with / — rejected by the "bare path" check.
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl(url, headers), "Should block encoded //: " + url);
    }

    @Test
    void testDoubleEncodedSlashIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // %252F%252F decodes to %2F%2F on first pass — not a valid scheme or relative path
        assertFalse(RedirectHelper.isSafeRedirectUrl("%252F%252Fevil.com", headers));
    }

    // --- Control character injection ---

    @ParameterizedTest
    @CsvSource({
        "https://evil.com%09/path",
        "https://evil.com%0a/path",
        "https://evil.com%0d/path",
        "https://evil.com%0d%0a/path",
        "https://evil.com%00/path",
    })
    void testControlCharacterInjectionIsBlocked(String url) {
        // Control characters (tab, LF, CR, CRLF, null) in URLs should not bypass validation.
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl(url, headers), "Should block control char injection: " + url);
    }

    // --- Whitespace attacks ---

    @Test
    void testWhitespacePrefixIsHandled() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // Leading whitespace before a malicious URL — StringUtils.hasText passes,
        // but it won't start with / or http(s):// → rejected.
        assertFalse(RedirectHelper.isSafeRedirectUrl(" https://evil.com", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("\thttps://evil.com", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("\nhttps://evil.com", headers));
    }

    // --- IPv6 address handling ---

    @Test
    void testIPv6LocalhostMatch() {
        HttpHeaders headers = headersWithOrigin("http://[::1]:8080");
        assertTrue(RedirectHelper.isSafeRedirectUrl("http://[::1]:8080/applications", headers));
        // Different IPv6 address should be blocked
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://[::2]:8080/applications", headers));
    }

    @Test
    void testIPv6VsIPv4Mismatch() {
        // IPv6 localhost [::1] should NOT match IPv4 127.0.0.1
        HttpHeaders headers = headersWithOrigin("http://127.0.0.1:8080");
        assertFalse(RedirectHelper.isSafeRedirectUrl("http://[::1]:8080/applications", headers));
    }

    // --- Single-slash scheme malformation ---

    @Test
    void testSingleSlashSchemeIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // https:/evil.com — missing a slash, not a valid http(s):// URL
        assertFalse(RedirectHelper.isSafeRedirectUrl("https:/evil.com", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("http:/evil.com", headers));
    }

    // --- Path traversal in URL ---

    @Test
    void testPathTraversalInAbsoluteUrl() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        // Same host with path traversal — host still matches, so this is safe
        assertTrue(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/../etc/passwd", headers));
        // Different host with path traversal — blocked
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com/../app.appsmith.com", headers));
    }

    // --- Fragment-based confusion ---

    @Test
    void testFragmentWithDotDomainIsBlocked() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com#.app.appsmith.com", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com#app.appsmith.com", headers));
    }

    // --- sanitizeRedirectUrl with newly vulnerable patterns ---

    @Test
    void testSanitizeBlocksUrlEncodedBypass() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        String result = RedirectHelper.sanitizeRedirectUrl("%2F%2Fevil.com", headers);
        assertEquals("https://app.appsmith.com/applications", result);
    }

    @Test
    void testSanitizeBlocksWhitespacePrefixedUrl() {
        HttpHeaders headers = headersWithOrigin("https://app.appsmith.com");
        String result = RedirectHelper.sanitizeRedirectUrl(" https://evil.com", headers);
        assertEquals("https://app.appsmith.com/applications", result);
    }

    // --- Forged Origin header (APP-15347) ---
    // These tests verify that the Origin header is cross-checked against the
    // request Host / X-Forwarded-Host before it is used to build or validate
    // redirect URLs. They exercise isSafeRedirectUrl (validation gate) and
    // sanitizeRedirectUrl (fallback construction) end-to-end.

    @Test
    void testForgedOriginHeaderIsBlockedWhenHostDiffers() {
        // Core pentest finding: attacker sets Origin: https://evil.com on a
        // form login POST while the real Host is app.appsmith.com. Both the
        // validation and the fallback must reject the forged domain.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("https://evil.com");
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));

        assertFalse(
                RedirectHelper.isSafeRedirectUrl("https://evil.com/applications", headers),
                "Redirect matching a forged Origin must be rejected when it differs from the request Host");

        String sanitized = RedirectHelper.sanitizeRedirectUrl("https://evil.com/applications", headers);
        assertFalse(sanitized.contains("evil.com"), "Sanitized fallback URL must not contain the forged Origin domain");
    }

    @Test
    void testForgedOriginViaXForwardedHost() {
        // Attacker controls both Origin and X-Forwarded-Host but not the
        // underlying Host header. X-Forwarded-Host takes precedence in
        // extractRequestHost, so when forged it becomes the trust anchor.
        // At the helper level this cannot be distinguished from a legitimate
        // proxy value — the real defence is ForwardedHeaderTransformer stripping
        // client-supplied forwarded headers before they reach the handler.
        // This test documents the helper's behaviour: it trusts whichever
        // X-Forwarded-Host it receives.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("https://evil.com");
        headers.set("X-Forwarded-Host", "evil.com");
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));

        // X-Forwarded-Host wins over Host, so Origin matches it — accepted at
        // the helper level (runtime protection is ForwardedHeaderTransformer).
        assertTrue(
                RedirectHelper.isSafeRedirectUrl("https://evil.com/applications", headers),
                "X-Forwarded-Host takes precedence; helper trusts it (ForwardedHeaderTransformer is the real guard)");
    }

    @Test
    void testLegitimateOriginMatchesXForwardedHostNotHost() {
        // Standard reverse-proxy setup: X-Forwarded-Host carries the public
        // hostname while Host carries the internal LB address. Origin matches
        // the public hostname and must be accepted.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("https://app.appsmith.com");
        headers.set("X-Forwarded-Host", "app.appsmith.com");
        headers.setHost(InetSocketAddress.createUnresolved("internal.lb", 0));

        assertTrue(
                RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers),
                "Origin matching X-Forwarded-Host must be accepted even when Host differs (proxy setup)");
    }

    @Test
    void testSameHostDifferentPortOriginIsRejected() {
        // Attacker forges Origin to a different port on the same IPv4 host.
        // A different port means a different service — must be rejected.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost:9090");
        headers.setHost(InetSocketAddress.createUnresolved("localhost", 8080));

        assertFalse(
                RedirectHelper.isSafeRedirectUrl("http://localhost:9090/applications", headers),
                "Same host but different port must be rejected — different port means different service");

        String sanitized = RedirectHelper.sanitizeRedirectUrl("http://localhost:9090/applications", headers);
        assertFalse(sanitized.contains("9090"), "Sanitized fallback must not redirect to the forged port");
    }

    @Test
    void testSameHostDifferentPortIPv6OriginIsRejected() {
        // Same-host different-port attack on IPv6 — exercises bracket stripping
        // in getTrustedOrigin plus port comparison.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://[::1]:9090");
        headers.set("X-Forwarded-Host", "[::1]:8080");

        assertFalse(
                RedirectHelper.isSafeRedirectUrl("http://[::1]:9090/applications", headers),
                "IPv6 same host but different port must be rejected");
    }

    @Test
    void testIPv6OriginMatchesRequestHost() {
        // Positive case: IPv6 Origin with matching X-Forwarded-Host (same host
        // and port) must be accepted. Exercises bracket stripping.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://[::1]:8080");
        headers.set("X-Forwarded-Host", "[::1]:8080");

        assertTrue(
                RedirectHelper.isSafeRedirectUrl("http://[::1]:8080/applications", headers),
                "IPv6 Origin matching X-Forwarded-Host (host + port) must be accepted");
    }

    @Test
    void testSameHostMatchingPortOriginIsAccepted() {
        // Positive case: Origin and Host agree on both hostname and port.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost:8080");
        headers.setHost(InetSocketAddress.createUnresolved("localhost", 8080));

        assertTrue(
                RedirectHelper.isSafeRedirectUrl("http://localhost:8080/applications", headers),
                "Origin matching Host on both hostname and port must be accepted");
    }

    @Test
    void testImplicitPortsAreAccepted() {
        // Both Origin and Host omit port (implicit defaults) — common in
        // production. Must be accepted without false rejection.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("https://app.appsmith.com");
        headers.setHost(InetSocketAddress.createUnresolved("app.appsmith.com", 0));

        assertTrue(
                RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers),
                "Implicit default ports on both sides must match");
    }
}
