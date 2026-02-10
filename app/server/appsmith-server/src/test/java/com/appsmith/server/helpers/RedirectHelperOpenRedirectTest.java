package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;

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
    void testAbsoluteUrlWithNoOriginHeaderIsBlocked() {
        HttpHeaders headers = new HttpHeaders(); // no Origin header
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://evil.com/phish", headers));
        assertFalse(RedirectHelper.isSafeRedirectUrl("https://app.appsmith.com/applications", headers));
    }

    @Test
    void testRelativeUrlWithNoOriginHeaderIsSafe() {
        HttpHeaders headers = new HttpHeaders(); // no Origin header
        assertTrue(RedirectHelper.isSafeRedirectUrl("/applications", headers));
        assertTrue(RedirectHelper.isSafeRedirectUrl("/applications/123/pages/456/edit", headers));
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
}
