package com.appsmith.util;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.InetAddress;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RestrictedHostFilterTest {

    @BeforeAll
    public static void enableFilterForThisClass() {
        // Surefire defaults the test JVM to bypass=true (see root pom). The filter-behavior
        // tests in this class need the filter actually ON to verify their assertions, so flip
        // the kill-switch back. resetSsrfFilterDisabledForTesting() in @AfterAll restores
        // whatever the surefire-set default was.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        // Neutralize the own-host set seeded from the test machine's real hostname so it can't
        // interfere with the allow-list assertions. Own-host tests set it explicitly.
        RestrictedHostFilter.setOwnHostsForTesting();
        RestrictedHostFilter.clearOwnResolvedIpsForTesting();
    }

    @AfterAll
    public static void restoreSurefireDefault() {
        RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
    }

    @AfterEach
    public void clearTestOverrides() {
        // Restore the internal Redis host filter and the always-allowed override to whatever
        // the JVM env produced at startup, so tests don't leak state into each other. The
        // disable-knob is also reset to the per-class state set in @BeforeAll above (filter on)
        // — individual tests that toggle it (e.g. the kill-switch tests) still need to flip it
        // back themselves between cases.
        RestrictedHostFilter.setInternalRedisHostsForTesting();
        RestrictedHostFilter.setOwnHostsForTesting();
        RestrictedHostFilter.clearOwnResolvedIpsForTesting();
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
    }

    @ParameterizedTest
    @ValueSource(strings = {"metadata.tencentyun.com", "Metadata.TencentYun.Com.", "METAdata.google.internal."})
    public void testIsDisallowedAndFailNormalizesMetadataHostnames(String host) {
        assertTrue(RestrictedHostFilter.isDisallowedAndFail(host, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "::1", "169.254.0.1", "fe80::1", "0.0.0.0", "fc00::1"})
    public void isDisallowedAndFail_blocksNonRoutableLiteralsUnconditionally(String host) {
        // Previously gated behind IN_DOCKER=1; now blocked everywhere (secure-by-default).
        assertTrue(
                RestrictedHostFilter.isDisallowedAndFail(host, null),
                "Expected " + host + " to be blocked by isDisallowedAndFail without IN_DOCKER");
    }

    // ---------- resolveIfAllowed: used by the SMTP test-email path (EnvManagerCEImpl) ----------

    @ParameterizedTest
    @ValueSource(
            strings = {
                "127.0.0.1",
                "169.254.169.254",
                "169.254.10.10",
                "100.100.100.200",
                "168.63.129.16",
                "0.0.0.0",
            })
    public void resolveIfAllowed_blocksLoopbackMetadataAndSpecialHosts(String host) {
        Optional<InetAddress> result = RestrictedHostFilter.resolveIfAllowed(host);
        assertTrue(result.isEmpty(), "Expected host " + host + " to be blocked");
    }

    @Test
    public void resolveIfAllowed_blocksNullAndEmpty() {
        assertTrue(RestrictedHostFilter.resolveIfAllowed(null).isEmpty());
        assertTrue(RestrictedHostFilter.resolveIfAllowed("").isEmpty());
        assertTrue(RestrictedHostFilter.resolveIfAllowed("  ").isEmpty());
    }

    @Test
    public void resolveIfAllowed_blocksLocalhostHostname() {
        Optional<InetAddress> result = RestrictedHostFilter.resolveIfAllowed("localhost");
        assertTrue(result.isEmpty(), "Expected 'localhost' to be blocked");
    }

    @ParameterizedTest
    @ValueSource(strings = {"smtp.gmail.com", "email-smtp.us-east-1.amazonaws.com", "smtp.sendgrid.net"})
    public void resolveIfAllowed_allowsLegitimateSmtpHosts(String host) {
        Optional<InetAddress> result = RestrictedHostFilter.resolveIfAllowed(host);
        assertTrue(result.isPresent(), "Expected host " + host + " to be allowed");
    }

    @Test
    public void resolveIfAllowed_blocksUnresolvableHost() {
        Optional<InetAddress> result =
                RestrictedHostFilter.resolveIfAllowed("definitely-not-a-real-host-xyz123.invalid");
        assertTrue(result.isEmpty(), "Expected unresolvable host to be blocked");
    }

    @Test
    public void resolveIfAllowed_returnsResolvedAddress() {
        // Use a literal IP rather than a public hostname — avoids a DNS lookup in CI and
        // dodges IPv6-preferred resolvers that would have failed the old IPv4-only regex
        // assertion on the resolved address.
        Optional<InetAddress> result = RestrictedHostFilter.resolveIfAllowed("1.1.1.1");
        assertTrue(result.isPresent());
        assertEquals("1.1.1.1", result.get().getHostAddress());
    }

    // ---------- isBlockedIpAddressClass: literal-only IP-class check ----------

    @ParameterizedTest
    @ValueSource(
            strings = {
                // Loopback
                "127.0.0.1",
                "127.0.0.2",
                "127.0.0.254",
                "127.1.2.3",
                "127.255.255.255",
                "::1",
                // Any-local
                "0.0.0.0",
                "::",
                // Link-local
                "169.254.0.1",
                "169.254.169.254",
                "fe80::1",
                // Multicast
                "224.0.0.1",
                "239.255.255.250",
                "ff02::1",
                // IPv6 ULA (fc00::/7)
                "fc00::1",
                "fd00::1",
                "fdff::ffff",
            })
    public void isBlockedIpAddressClass_recognizesNonRoutableClasses(String host) {
        assertTrue(
                RestrictedHostFilter.isBlockedIpAddressClass(host),
                "Expected " + host + " to be recognized as a blocked address class");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "1.1.1.1",
                "8.8.8.8",
                // RFC 1918 site-local — intentionally allowed for internal REST API targets
                "192.168.1.1",
                "10.0.0.1",
                "172.16.0.1",
                // Non-literals
                "smtp.gmail.com",
                "localhost",
            })
    public void isBlockedIpAddressClass_doesNotMatchOtherHosts(String host) {
        assertFalse(
                RestrictedHostFilter.isBlockedIpAddressClass(host),
                "Did not expect " + host + " to be recognized as a blocked address class");
    }

    // ---------- Non-canonical IP literals (GHSA-x3j2-rfj9-cc32, GHSA-342c-q2qr-jxrj) ----------
    //
    // Two ways an internal destination hides from the filter while the HTTP client still
    // connects to it:
    //
    //   1. Leading-zero octets ("127.0.0.01"). Apache Commons InetAddressValidator rejects
    //      these, so the host was never canonicalized and was compared as an opaque string.
    //      Netty's NetUtil parses them as decimal, and reactor-netty hands the client an
    //      already-resolved address, so the resolver hook never runs either.
    //   2. IPv6 transition addresses (NAT64 64:ff9b::/96 and 64:ff9b:1::/48, 6to4 2002::/16).
    //      Every parser agrees these are valid IPv6; the filter simply never unwrapped the
    //      embedded IPv4, so it classified the outer wrapper instead of the destination.

    @ParameterizedTest
    @ValueSource(
            strings = {
                // Loopback
                "127.0.0.01",
                "127.000.000.001",
                "127.0.0.001",
                // Link-local
                "169.254.001.001",
                "169.254.0.01",
                // Any-local
                "0.0.0.00",
                "00.0.0.0",
                // Multicast
                "224.0.0.01",
                // IPv4-mapped IPv6 carrying a zero-padded embedded octet
                "::ffff:127.0.0.01",
                "::ffff:169.254.001.001",
            })
    public void isBlockedIpAddressClass_recognizesZeroPaddedNonRoutableLiterals(String host) {
        assertTrue(
                RestrictedHostFilter.isBlockedIpAddressClass(host),
                "Expected zero-padded literal " + host + " to be recognized as a blocked address class");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                // NAT64 well-known prefix (RFC 6052) embedding a non-routable IPv4
                "64:ff9b::7f00:1", // 127.0.0.1
                "64:ff9b::a9fe:a9fe", // 169.254.169.254
                "64:ff9b::e000:1", // 224.0.0.1
                // NAT64 local-use prefix (RFC 8215, 64:ff9b:1::/48). Per RFC 6052 the embedded
                // IPv4 lives in bytes 6-7 and 9-10 (byte 8 is the reserved u-octet), NOT the low
                // 32 bits. The first two have zero in those positions, so they embed 0.0.0.0
                // (any-local) and block on that; the next two embed a non-routable address in the
                // correct /48 position while carrying a *routable* suffix in the low 32 bits —
                // reading the low bits (the old behavior) would let these through.
                "64:ff9b:1::7f00:1", // /48 positions zero -> 0.0.0.0
                "64:ff9b:1::a9fe:a9fe", // /48 positions zero -> 0.0.0.0
                "64:ff9b:1:7f00:0:100:808:808", // /48 embeds 127.0.0.1; low bits 8.8.8.8
                "64:ff9b:1:a9fe:a9:fe00:808:808", // /48 embeds 169.254.169.254; low bits 8.8.8.8
                // 6to4 (RFC 3056) — embedded IPv4 sits in bytes 2-5
                "2002:7f00:1::", // 127.0.0.1
                "2002:a9fe:a9fe::", // 169.254.169.254
                // IPv4-translated (RFC 2765) — 0xffff sits in bytes 8-9, not 10-11 as in mapped
                "::ffff:0:127.0.0.1",
                "::ffff:0:7f00:1",
                "::ffff:0:a9fe:a9fe",
                // ISATAP (RFC 5214) — IPv4 in the interface identifier after the 5efe marker
                "::5efe:127.0.0.1",
                "::0:5efe:7f00:1",
                "2001:db8::5efe:7f00:1",
                "2001:db8::200:5efe:a9fe:a9fe",
                // Teredo (RFC 4380) — relay server IPv4 in bytes 4-7, client IPv4 in bytes 12-15
                // stored as its ones-complement
                "2001:0:7f00:1::", // server 127.0.0.1
                "2001:0:a9fe:a9fe::", // server 169.254.169.254
                "2001:0:0:0:0:0:80ff:fffe", // client ones-complement of 127.0.0.1
            })
    public void isBlockedIpAddressClass_recognizesIpv6TransitionEmbeddedNonRoutable(String host) {
        assertTrue(
                RestrictedHostFilter.isBlockedIpAddressClass(host),
                "Expected transition address " + host + " to be classified by its embedded IPv4");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                // RFC 1918 is intentionally ALLOWED (see resolveIfAllowed). Canonicalizing a
                // zero-padded literal must not start blocking a range the filter permits — the
                // fix normalizes these, it does not reject them.
                "010.0.0.1",
                "192.168.001.001",
                "172.016.0.1",
                // Ordinary public addresses in zero-padded form stay allowed too.
                "008.008.008.008",
                // A 6to4 address embedding a routable public IPv4 must remain reachable: on an
                // IPv6-only network this is how legitimate IPv4 destinations are addressed.
                "2002:0808:0808::",
                "64:ff9b::808:808",
                // NAT64 /48 local-use embedding a routable public IPv4 (8.8.8.8) in the correct
                // RFC 6052 /48 position. Reading the low 32 bits (the old behavior) saw 0.0.0.0
                // and over-blocked this legitimate destination.
                "64:ff9b:1:808:8:800::",
            })
    public void isBlockedIpAddressClass_stillAllowsRoutableNonCanonicalLiterals(String host) {
        assertFalse(
                RestrictedHostFilter.isBlockedIpAddressClass(host),
                "Did not expect routable literal " + host + " to be blocked");
    }

    // The WebClient/HTTP path is the one the advisories exercise: isLiteralBlocked is the
    // pre-resolver fast path and isDisallowedAndFail is the resolver hook. Drive both, not just
    // the address-class helper they delegate to.

    @ParameterizedTest
    @ValueSource(
            strings = {
                "127.0.0.01",
                "127.000.000.001",
                "169.254.001.001",
                "0.0.0.00",
                // Denylist entry reachable by zero-padding its final octet
                "168.63.129.016",
                "::ffff:127.0.0.01",
                "64:ff9b::7f00:1",
                "64:ff9b::a9fe:a9fe",
                "2002:7f00:1::",
            })
    public void isLiteralBlocked_blocksNonCanonicalAndTransitionLiterals(String host) {
        assertTrue(
                RestrictedHostFilter.isLiteralBlocked(host),
                "Expected " + host + " to be blocked on the WebClient pre-resolver fast path");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "127.0.0.01",
                "127.000.000.001",
                "169.254.001.001",
                "0.0.0.00",
                "168.63.129.016",
                "::ffff:127.0.0.01",
                "64:ff9b::7f00:1",
                "64:ff9b::a9fe:a9fe",
                "2002:7f00:1::",
            })
    public void isDisallowedAndFail_blocksNonCanonicalAndTransitionLiterals(String host) {
        assertTrue(
                RestrictedHostFilter.isDisallowedAndFail(host, null),
                "Expected " + host + " to be blocked by the Netty resolver hook");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "1.1.1.1",
                "8.8.8.8",
                "010.0.0.1",
                "192.168.001.001",
                "smtp.gmail.com",
                // Octal-looking literals are read as decimal by both Netty and the JVM, so these dial
                // 177.0.0.1 rather than 127.0.0.1 and are not loopback in disguise. Should any runtime
                // ever read them as octal, the resolver hook catches the loopback address post-DNS.
                "0177.0.0.1",
                "0177.0.0.01",
            })
    public void isLiteralBlocked_stillAllowsPublicAndPrivateHosts(String host) {
        assertFalse(RestrictedHostFilter.isLiteralBlocked(host), "Did not expect " + host + " to be blocked");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "127.0.0.01",
                "169.254.001.001",
                "::ffff:127.0.0.01",
                "64:ff9b::7f00:1",
                "2002:7f00:1::",
            })
    public void isHostBlocked_blocksNonCanonicalAndTransitionLiterals(String host) {
        assertTrue(RestrictedHostFilter.isHostBlocked(host), "Expected " + host + " to be blocked");
    }

    /**
     * The invariant behind both advisories: whatever address the runtime would actually dial, if it
     * is non-routable the request must not get through. Two different stages enforce that — literals
     * Netty pre-parses are caught on the fast path, and the ones it declines (dotted-decimal
     * shorthand, 32-bit integers) are caught after the resolver runs. Asserting the end-to-end
     * verdict rather than the stage means dropping either half fails this test.
     */
    @ParameterizedTest
    @ValueSource(
            strings = {
                // Netty pre-parses these, so the resolver hook never sees them
                "127.0.0.01",
                "127.000.000.001",
                "169.254.001.001",
                "0.0.0.00",
                "224.0.0.01",
                // Netty declines these; the JVM resolver still lands on loopback
                "2130706433",
                "127.1",
                "127.0.1",
            })
    public void blocksEveryLiteralSpellingThatResolvesToANonRoutableAddress(String literal) throws Exception {
        final InetAddress effective = InetAddress.getByName(literal);
        assertTrue(
                RestrictedHostFilter.matchesBlockedAddressClass(effective),
                "precondition: " + literal + " must resolve to a non-routable address, got "
                        + effective.getHostAddress());
        assertTrue(
                RestrictedHostFilter.isLiteralBlocked(literal)
                        || RestrictedHostFilter.isDisallowedAndFail(literal, null)
                        || RestrictedHostFilter.isDisallowedAndFail(effective.getHostAddress(), null),
                literal + " resolves to " + effective.getHostAddress() + " but the filter allows it");
    }

    // ---------- isHostBlocked: used by the Redis plugin (GHSA-qhfj-g87x-m39w) ----------

    @Test
    public void isHostBlocked_returnsFalseForNullOrEmpty() {
        assertFalse(RestrictedHostFilter.isHostBlocked(null));
        assertFalse(RestrictedHostFilter.isHostBlocked(""));
        assertFalse(RestrictedHostFilter.isHostBlocked("  "));
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                // Static metadata-endpoint denylist literals
                "169.254.169.254",
                "100.100.100.200",
                "168.63.129.16",
                "metadata.google.internal",
                "metadata.tencentyun.com",
                "METAdata.google.internal.",
                // Non-routable address classes — blocked unconditionally for Redis (unlike the
                // IN_DOCKER-gated HTTP filter), since the GHSA targets loopback in any
                // deployment that doesn't sit behind Docker.
                "127.0.0.1",
                "127.0.0.42",
                "0.0.0.0",
                "169.254.10.10",
                "::1",
                "fe80::1",
                "fc00::1",
                "fdff::ffff",
                "224.0.0.1",
            })
    public void isHostBlocked_blocksDenylistAndNonRoutableLiterals(String host) {
        assertTrue(RestrictedHostFilter.isHostBlocked(host), "Expected " + host + " to be blocked");
    }

    @Test
    public void isHostBlocked_blocksLocalhostHostname() {
        // "localhost" resolves to 127.0.0.1 / ::1 — caught via the resolved-address loopback check.
        assertTrue(RestrictedHostFilter.isHostBlocked("localhost"));
    }

    @Test
    public void isHostBlocked_returnsFalseForUnresolvableHost() {
        // Key difference vs. resolveIfAllowed(): an unresolvable host is NOT blocked so that a
        // transient DNS failure at config-save time doesn't reject an otherwise legitimate
        // datasource. The driver will surface the real connection error later.
        assertFalse(RestrictedHostFilter.isHostBlocked("definitely-not-a-real-host-xyz123.invalid"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"smtp.gmail.com", "email-smtp.us-east-1.amazonaws.com", "1.1.1.1"})
    public void isHostBlocked_allowsLegitimateHosts(String host) {
        assertFalse(RestrictedHostFilter.isHostBlocked(host), "Did not expect " + host + " to be blocked");
    }

    @Test
    public void isHostBlocked_matchesConfiguredInternalRedisHostnameLiterally() {
        RestrictedHostFilter.setInternalRedisHostsForTesting("internal-redis.svc.cluster.local");
        assertTrue(RestrictedHostFilter.isHostBlocked("internal-redis.svc.cluster.local"));
        // Case-insensitive — datasource configs are user-entered.
        assertTrue(RestrictedHostFilter.isHostBlocked("INTERNAL-Redis.svc.cluster.local"));
    }

    @Test
    public void isHostBlocked_blocksWhenUserHostResolvesToSameIpsAsInternalRedis() {
        // Same hostname for both sides — guarantees IP overlap on whatever the test environment
        // resolves it to. Validates the dynamic-resolution overlap path. Uses a stable public
        // domain rather than depending on the env-resolved internal Redis hostname.
        RestrictedHostFilter.setInternalRedisHostsForTesting("one.one.one.one");
        assertTrue(RestrictedHostFilter.isHostBlocked("one.one.one.one"));
    }

    @Test
    public void isHostBlocked_doesNotBlockUnrelatedHostWhenInternalRedisConfigured() {
        RestrictedHostFilter.setInternalRedisHostsForTesting("internal-redis.svc.cluster.local");
        assertFalse(RestrictedHostFilter.isHostBlocked("smtp.gmail.com"));
    }

    @Test
    public void isHostBlocked_blocksAllConfiguredInternalRedisHosts() {
        // Production reads APPSMITH_REDIS_URL (session store) and APPSMITH_REDIS_GIT_URL (git
        // Redis used by the workspace git import/sync flow). When they're set to different
        // hosts, both must be in the deny set.
        RestrictedHostFilter.setInternalRedisHostsForTesting(
                "session-redis.svc.cluster.local", "git-redis.svc.cluster.local");
        assertTrue(RestrictedHostFilter.isHostBlocked("session-redis.svc.cluster.local"));
        assertTrue(RestrictedHostFilter.isHostBlocked("git-redis.svc.cluster.local"));
        // Unrelated host stays allowed.
        assertFalse(RestrictedHostFilter.isHostBlocked("redis.example.com"));
    }

    @Test
    public void registerInternalRedisHosts_blocksHostFromSpringResolvedUrl() {
        // Mirrors the server's startup path (RedisConfig#registerInternalRedisHostsWithSsrfFilter):
        // the app binds appsmith.redis.url via Spring, which the env-only static seed misses when
        // Redis is configured via application.properties / -D. Hosts registered from the resolved
        // URLs must be blocked, closing the fail-open gap. See GHSA-qhfj-g87x-m39w.
        RestrictedHostFilter.setInternalRedisHostsForTesting(); // start empty (no env var set)
        RestrictedHostFilter.registerInternalRedisHosts(
                "redis://session-redis.svc.cluster.local:6379", "rediss://git-redis.svc.cluster.local:6380");
        assertTrue(RestrictedHostFilter.isHostBlocked("session-redis.svc.cluster.local"));
        assertTrue(RestrictedHostFilter.isHostBlocked("git-redis.svc.cluster.local"));
        // Null / blank URLs are ignored and unrelated hosts stay allowed.
        RestrictedHostFilter.registerInternalRedisHosts((String) null, "", "   ");
        assertFalse(RestrictedHostFilter.isHostBlocked("redis.example.com"));
    }

    @Test
    public void registerInternalRedisHosts_unionsWithExistingHosts() {
        // Registration must not clobber the env-seeded set: configuring Redis through both the env
        // var and a property must block both.
        RestrictedHostFilter.setInternalRedisHostsForTesting("env-seeded-redis.svc.cluster.local");
        RestrictedHostFilter.registerInternalRedisHosts("redis://property-redis.svc.cluster.local:6379");
        assertTrue(RestrictedHostFilter.isHostBlocked("env-seeded-redis.svc.cluster.local"));
        assertTrue(RestrictedHostFilter.isHostBlocked("property-redis.svc.cluster.local"));
    }

    // ---------- ownHosts: defense-in-depth block on the instance's own routable IP ----------
    // The instance's own IP is typically RFC 1918 / site-local (Docker bridge 172.17.x, k8s pod
    // 10.x, ...), which the filter intentionally allows for legitimate private-network
    // datasources. Registered own hostnames are unresolvable *.invalid literals and the "resolved"
    // own IPs are injected via setOwnResolvedIpsForTesting, so these tests are deterministic and
    // never depend on live public DNS. 10.123.45.67 stands in for the instance's own RFC 1918 IP.

    @Test
    public void isHostBlocked_blocksOwnIpWhenReachedByRawIpv4Literal() {
        // A datasource pointed at the raw IP the own host resolves to must be blocked via the
        // resolved-address overlap — even though that IP class (RFC 1918) is otherwise allowed.
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        assertTrue(RestrictedHostFilter.isHostBlocked("10.123.45.67"));
    }

    @Test
    public void isHostBlocked_blocksOwnIpViaIpv4MappedIpv6() {
        // ::ffff:10.123.45.67 canonicalizes to 10.123.45.67 (see normalizeIpAddress) and resolves
        // to the same address, so the IPv4-mapped IPv6 form is caught by the same overlap check.
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        assertTrue(RestrictedHostFilter.isHostBlocked("::ffff:10.123.45.67"));
    }

    @Test
    public void isHostBlocked_blocksOwnHostByHostnameLiteral() {
        // Typing the instance's own hostname is blocked via the literal (canonical) match, and
        // case-insensitively — datasource configs are user-entered. No DNS needed.
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        assertTrue(RestrictedHostFilter.isHostBlocked("own-host.invalid"));
        assertTrue(RestrictedHostFilter.isHostBlocked("OWN-Host.INVALID"));
    }

    @Test
    public void isHostBlocked_doesNotBlockDifferentRfc1918AddressWhenOwnHostConfigured() {
        // Guardrail: only the instance's OWN address is blocked, not the rest of the private
        // network. These RFC 1918 hosts don't overlap with the injected own IP, so they stay
        // allowed — proving we didn't over-block legitimate private-network datasources.
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        assertFalse(RestrictedHostFilter.isHostBlocked("192.168.1.1"));
        assertFalse(RestrictedHostFilter.isHostBlocked("10.0.0.1"));
        assertFalse(RestrictedHostFilter.isHostBlocked("172.16.0.1"));
    }

    @Test
    public void registerOwnHost_blocksHostAndUnionsWithExistingSet() {
        // Mirrors the server's startup path (RedisConfig#registerOwnHostWithSsrfFilter): the
        // registration unions with — does not replace — the existing set, and null/blank entries
        // are ignored.
        RestrictedHostFilter.setOwnHostsForTesting("seeded-own.invalid");
        RestrictedHostFilter.registerOwnHost("registered-own.invalid");
        RestrictedHostFilter.registerOwnHost((String) null, "", "   ");
        assertTrue(RestrictedHostFilter.isHostBlocked("seeded-own.invalid"));
        assertTrue(RestrictedHostFilter.isHostBlocked("registered-own.invalid"));
    }

    // The own-IP block must be enforced on the actual security entry points, not just isHostBlocked:
    // isDisallowedAndFail is the shared address-level policy for the WebClient (Netty) and
    // Elasticsearch resolver hooks; isLiteralBlocked is the WebClient pre-resolver fast path;
    // firstAllowedRedisAddress is the Redis connect-time path. Missing coverage here is exactly why
    // an own-IP bypass could ship with isHostBlocked green.

    @Test
    public void isDisallowedAndFail_blocksOwnHostAndResolvedOwnIp() {
        // This is the method the WebClient + Elasticsearch resolver hooks call, both pre-DNS (the
        // host/URL literal) and post-DNS (the resolved address string). Both forms must be blocked.
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        // Own hostname literal (pre-DNS) and raw / resolved own IP (pre- or post-DNS).
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("own-host.invalid", null));
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("10.123.45.67", null));
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("::ffff:10.123.45.67", null));
        // A different RFC 1918 address is not the own IP — still allowed (no over-block).
        assertFalse(RestrictedHostFilter.isDisallowedAndFail("10.0.0.9", null));
    }

    @Test
    public void isLiteralBlocked_blocksOwnHostnameLiterally() {
        // The pre-resolver fast path blocks a URL that literally names the instance's own host,
        // case-insensitively, without doing DNS. (The own-IP overlap is enforced post-DNS by the
        // resolver hook via isDisallowedAndFail, covered above.)
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        assertTrue(RestrictedHostFilter.isLiteralBlocked("own-host.invalid"));
        assertTrue(RestrictedHostFilter.isLiteralBlocked("OWN-Host.INVALID"));
    }

    @Test
    public void isDisallowedAndFail_ownIpCheckReadsCacheNotLiveDns() {
        // Proves the resolver-hook hot path does NO DNS: the own hostname is unresolvable, yet an
        // injected cached own IP is still blocked. If isDisallowedAndFail live-resolved ownHosts,
        // the unresolvable name would yield no IPs and 10.123.45.67 would pass — so blocking it can
        // only come from the cache. The check is pure set-membership, safe on the Netty EventLoop.
        RestrictedHostFilter.setOwnHostsForTesting("unresolvable-own.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("10.123.45.67", null));
        // Clearing the cache (without touching ownHosts) immediately stops blocking that IP — the
        // decision is cache-driven, not re-derived from the hostname on each call.
        RestrictedHostFilter.clearOwnResolvedIpsForTesting();
        assertFalse(RestrictedHostFilter.isDisallowedAndFail("10.123.45.67", null));
    }

    @Test
    public void registerOwnHost_recomputesOwnIpCacheOffHotPath() {
        // registerOwnHost (the startup @PostConstruct path) recomputes the cached own-IP set from
        // ownHosts. Seed a stale cached IP, then register an (unresolvable) own host: the refresh
        // recomputes the cache from ownHosts — which resolves to nothing here — dropping the stale
        // value. This is where own-hostname resolution happens, off the request hot path.
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.1.1.1");
        RestrictedHostFilter.registerOwnHost("registered-own.invalid");
        assertFalse(RestrictedHostFilter.isDisallowedAndFail("10.1.1.1", null));
        // The registered hostname is still blocked literally (no DNS needed).
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("registered-own.invalid", null));
    }

    @Test
    public void firstAllowedRedisAddress_blocksResolvedOwnIp() throws Exception {
        // The Redis connect-time path shares the same address-level policy; a resolved address that
        // is the instance's own IP is rejected, while a different RFC 1918 address is returned.
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        InetAddress ownAddr = InetAddress.getByName("10.123.45.67");
        assertTrue(RestrictedHostFilter.firstAllowedRedisAddress("redis-host", new InetAddress[] {ownAddr})
                .isEmpty());
        InetAddress otherAddr = InetAddress.getByName("10.0.0.9");
        assertTrue(RestrictedHostFilter.firstAllowedRedisAddress("redis-host", new InetAddress[] {otherAddr})
                .isPresent());
    }

    @Test
    public void ssrfFilterDisabled_bypassesOwnHostBlockOnAllEntryPoints() {
        RestrictedHostFilter.setOwnHostsForTesting("own-host.invalid");
        RestrictedHostFilter.setOwnResolvedIpsForTesting("10.123.45.67");
        // Sanity: blocked by default across every entry point.
        assertTrue(RestrictedHostFilter.isHostBlocked("10.123.45.67"));
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("10.123.45.67", null));
        assertTrue(RestrictedHostFilter.isLiteralBlocked("own-host.invalid"));
        // Kill-switch on — the own-host block is bypassed like every other check.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(true);
        assertFalse(RestrictedHostFilter.isHostBlocked("10.123.45.67"));
        assertFalse(RestrictedHostFilter.isHostBlocked("own-host.invalid"));
        assertFalse(RestrictedHostFilter.isDisallowedAndFail("10.123.45.67", null));
        assertFalse(RestrictedHostFilter.isLiteralBlocked("own-host.invalid"));
    }

    @Test
    public void describeResolvedAddresses_reportsResolvedIpOrUnresolved() {
        // Log-only annotation for the SSRF block lines. An IP literal resolves to itself; the
        // reserved .invalid TLD never resolves (RFC 2606) so it reports "unresolved".
        assertEquals("127.0.0.1", RestrictedHostFilter.describeResolvedAddresses("127.0.0.1"));
        assertEquals("unresolved", RestrictedHostFilter.describeResolvedAddresses("definitely-not-a-host.invalid"));
    }

    // ---------- alwaysAllowedHostsForTesting: opt-in test escape hatch ----------

    @Test
    public void alwaysAllowedHostsForTesting_lets_an_otherwise_blocked_host_through() {
        // Sanity: 127.0.0.1 is normally blocked.
        assertTrue(RestrictedHostFilter.isHostBlocked("127.0.0.1"));
        // Allow it explicitly.
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting("127.0.0.1");
        assertFalse(RestrictedHostFilter.isHostBlocked("127.0.0.1"));
        // Other blocked hosts are still blocked.
        assertTrue(RestrictedHostFilter.isHostBlocked("169.254.169.254"));
    }

    // ---------- isLiteralBlocked: synchronous fast path, no DNS ----------

    @Test
    public void isLiteralBlocked_returnsFalseForNullEmptyAndUnresolvable() {
        assertFalse(RestrictedHostFilter.isLiteralBlocked(null));
        assertFalse(RestrictedHostFilter.isLiteralBlocked(""));
        assertFalse(RestrictedHostFilter.isLiteralBlocked("  "));
        // Unresolvable hostname must not trigger a DNS lookup; the literal isn't on the deny set
        // so it falls through to "not blocked".
        assertFalse(RestrictedHostFilter.isLiteralBlocked("definitely-not-a-real-host-xyz123.invalid"));
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "169.254.169.254",
                "metadata.google.internal",
                "127.0.0.1",
                "::1",
                "169.254.10.10",
                "fc00::1",
            })
    public void isLiteralBlocked_blocksDenylistAndNonRoutableLiterals(String host) {
        assertTrue(RestrictedHostFilter.isLiteralBlocked(host), "Expected " + host + " to be blocked");
    }

    @Test
    public void isLiteralBlocked_blocksConfiguredInternalRedisHostnameLiterally() {
        RestrictedHostFilter.setInternalRedisHostsForTesting("internal-redis.svc.cluster.local");
        assertTrue(RestrictedHostFilter.isLiteralBlocked("internal-redis.svc.cluster.local"));
        assertTrue(RestrictedHostFilter.isLiteralBlocked("INTERNAL-Redis.svc.cluster.local"));
    }

    @Test
    public void isLiteralBlocked_doesNotResolveHostnamesToCheckBlockedClass() {
        // "localhost" resolves to 127.0.0.1, but isLiteralBlocked must not do DNS — and "localhost"
        // itself isn't on the static denylist, so it passes. (isHostBlocked would catch it via DNS;
        // that's the correct method to call from the async connection path.)
        assertFalse(RestrictedHostFilter.isLiteralBlocked("localhost"));
    }

    @Test
    public void alwaysAllowedHostsForTesting_clears_cleanly() {
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting("127.0.0.1");
        assertFalse(RestrictedHostFilter.isHostBlocked("127.0.0.1"));
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
        assertTrue(RestrictedHostFilter.isHostBlocked("127.0.0.1"));
    }

    // ---------- APPSMITH_DISABLE_SSRF_FILTER kill-switch ----------

    @Test
    public void ssrfFilterDisabled_bypassesIsHostBlocked() {
        // Sanity: blocked by default.
        assertTrue(RestrictedHostFilter.isHostBlocked("127.0.0.1"));
        assertTrue(RestrictedHostFilter.isHostBlocked("169.254.169.254"));
        // Flip the kill-switch — everything passes.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(true);
        assertFalse(RestrictedHostFilter.isHostBlocked("127.0.0.1"));
        assertFalse(RestrictedHostFilter.isHostBlocked("169.254.169.254"));
        assertFalse(RestrictedHostFilter.isHostBlocked("localhost"));
    }

    @Test
    public void ssrfFilterDisabled_bypassesIsLiteralBlocked() {
        assertTrue(RestrictedHostFilter.isLiteralBlocked("127.0.0.1"));
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(true);
        assertFalse(RestrictedHostFilter.isLiteralBlocked("127.0.0.1"));
        assertFalse(RestrictedHostFilter.isLiteralBlocked("169.254.169.254"));
    }

    @Test
    public void ssrfFilterDisabled_bypassesIsDisallowedAndFail() {
        assertTrue(RestrictedHostFilter.isDisallowedAndFail("127.0.0.1", null));
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(true);
        assertFalse(RestrictedHostFilter.isDisallowedAndFail("127.0.0.1", null));
        assertFalse(RestrictedHostFilter.isDisallowedAndFail("169.254.169.254", null));
    }

    @Test
    public void ssrfFilterDisabled_bypassesResolveIfAllowed() {
        // Loopback normally returns empty.
        assertTrue(RestrictedHostFilter.resolveIfAllowed("127.0.0.1").isEmpty());
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(true);
        // With the kill-switch on, the resolved address comes back.
        Optional<InetAddress> result = RestrictedHostFilter.resolveIfAllowed("127.0.0.1");
        assertTrue(result.isPresent());
        assertEquals("127.0.0.1", result.get().getHostAddress());
    }

    @Test
    public void ssrfFilterDisabled_doesNotAffectAddressClassPredicates() {
        // The kill-switch turns off enforcement, not facts about the address itself.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(true);
        assertTrue(RestrictedHostFilter.isBlockedIpAddressClass("127.0.0.1"));
        assertTrue(RestrictedHostFilter.isBlockedIpAddressClass("169.254.0.1"));
        assertTrue(RestrictedHostFilter.isBlockedIpAddressClass("fc00::1"));
    }
}
