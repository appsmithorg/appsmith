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
