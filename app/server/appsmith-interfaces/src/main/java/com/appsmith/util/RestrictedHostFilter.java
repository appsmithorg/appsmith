package com.appsmith.util;

import io.netty.util.concurrent.Promise;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.validator.routines.InetAddressValidator;
import org.springframework.util.StringUtils;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Host-allowed/blocked filter for Appsmith's SSRF protections. Today used by:
 * <ul>
 *     <li>{@link WebClientUtils} — request filter + Reactor Netty resolver covering REST,
 *     GraphQL, SaaS, and other WebClient-based plugins.</li>
 *     <li>The Elasticsearch plugin's Apache HttpAsyncClient resolver hook.</li>
 *     <li>The Redis plugin's {@code datasourceCreate} (connection-time enforcement; the
 *     plugin's {@code validateDatasource} intentionally does not enforce — see
 *     {@link com.appsmith.external.plugins.PluginExecutor#validateDatasource}, which
 *     documents that method as format-only).</li>
 *     <li>The SMTP test-email admin path in {@code EnvManagerCEImpl}.</li>
 * </ul>
 *
 * <p>Not applied to the JDBC plugins (Postgres, MySQL, MSSQL, Oracle, Redshift, Snowflake,
 * Databricks), Mongo, ArangoDB, or the SMTP runtime send path. Several of those support SSH
 * tunneling, where the user-entered host is resolved on the SSH server rather than in the
 * Java process — a literal/IP check here would false-positive any datasource tunneling to
 * loopback or an RFC1918 address on the far side of the tunnel. Closing those gaps needs
 * per-plugin design, not a drop-in of {@link #isHostBlocked(String)}.
 *
 * <p>Two entry points for the two access patterns: {@link #isHostBlocked(String)} is
 * DNS-aware and intended for plugin connection paths that run on a scheduler tolerating
 * blocking I/O (e.g. Redis's {@code datasourceCreate}, wrapped in
 * {@code Mono.fromCallable(...).subscribeOn(boundedElastic)}); {@link #isLiteralBlocked(String)}
 * is literal-only, for pre-resolver fast paths where the Netty/driver resolver runs DNS
 * separately, or for sync paths that can't afford a DNS round-trip.
 */
@Slf4j
public final class RestrictedHostFilter {

    public static final String HOST_NOT_ALLOWED = "Host not allowed.";

    /**
     * Opt-out env var for the SSRF filter. Default is on (secure by default). Set
     * {@code APPSMITH_DISABLE_SSRF_FILTER=true} in production only when the deployment
     * intentionally needs to allow datasources / WebClient targets that point at loopback,
     * link-local, or cloud-metadata addresses — e.g. local development against a service on
     * {@code localhost}, or a single-tenant install where the operator accepts the risk.
     *
     * <p>The surefire test JVM also sets the {@code appsmith.test.bypass.ssrf} system property
     * (see root pom) so that integration tests using MockWebServer / Testcontainers on loopback
     * don't fight the filter. The two filter-specific test classes
     * ({@code RestrictedHostFilterTest}, {@code WebClientUtilsTest}) flip the filter back on in
     * {@code @BeforeAll} and use {@link #resetSsrfFilterDisabledForTesting()} in
     * {@code @AfterAll} to restore the test-JVM-wide default.
     *
     * <p>When the filter is disabled, all of {@link #isHostBlocked(String)},
     * {@link #isLiteralBlocked(String)}, {@link #isDisallowedAndFail(String, Promise)}, and
     * {@link #resolveIfAllowed(String)} skip their checks. The address-class predicates
     * ({@link #isBlockedIpAddressClass(String)}, {@link #matchesBlockedAddressClass(InetAddress)})
     * still return facts about the address itself; callers that want to honor the kill-switch
     * should consult the high-level "is this allowed" methods instead.
     */
    private static final boolean INITIAL_SSRF_FILTER_DISABLED = computeSsrfFilterDisabled();

    private static volatile boolean ssrfFilterDisabled = INITIAL_SSRF_FILTER_DISABLED;

    private static final InetAddressValidator inetAddressValidator = InetAddressValidator.getInstance();

    private static final Set<String> DISALLOWED_HOSTS = computeDisallowedHosts();

    /**
     * Hostnames of the internal Redis instances Appsmith runs for its own state — the session
     * store ({@code APPSMITH_REDIS_URL}) and the Git Redis used by the workspace git
     * import/sync flow ({@code APPSMITH_REDIS_GIT_URL}). Both are parsed at JVM start; the set
     * is empty if neither env var is set or both are unparseable. The Git Redis URL falls back
     * to the main URL via Spring property resolution, so in practice this set is usually a
     * single entry — but we read both env vars directly here in case they're pointed at
     * different hosts.
     *
     * <p>Used by {@link #isHostBlocked(String)} and {@link #isLiteralBlocked(String)} to
     * prevent datasource plugins from being pointed at either internal Redis via direct
     * hostname or via an IP that one of those hostnames currently resolves to.
     *
     * <p>Volatile + public setter (for tests only) instead of {@code final} so unit tests can
     * exercise the overlap-detection logic without relying on the JVM's launch environment.
     * Production code never mutates this.
     */
    private static volatile Set<String> internalRedisHosts = computeInternalRedisHosts();

    /**
     * Test-only override that lets specific hosts bypass {@link #isHostBlocked(String)}. Used by
     * integration tests that spin up real services on loopback (e.g. Testcontainers-exposed
     * Redis on localhost) where the production block on loopback would otherwise prevent the
     * test from connecting. Empty in production runs; not mutated by production code.
     */
    private static volatile Set<String> alwaysAllowedHostsForTesting = Collections.emptySet();

    private RestrictedHostFilter() {}

    private static Set<String> computeDisallowedHosts() {
        final Set<String> hosts = new HashSet<>();
        addDisallowedHosts(
                hosts,
                "169.254.169.254",
                "168.63.129.16",
                "fd00:ec2::254",
                "fd20:ce::254",
                "100.100.100.200",
                "169.254.10.10",
                "169.254.170.2",
                "metadata.google.internal",
                "metadata.tencentyun.com");

        // Loopback literals — always denied. matchesBlockedAddressClass catches them via
        // isLoopbackAddress() on a resolved InetAddress, but isBlockedIpAddressClass operates
        // on the canonical *string* form, and the IPv4-compat normalization in normalizeIpAddress
        // turns "::1" into "0.0.0.1" (the embedded IPv4 bytes) which is no longer recognized as
        // loopback. Seeding both literals here closes that gap: they get stored under their
        // canonical forms, so any input that normalizes to the same form is blocked via this set.
        // (Previously gated behind IN_DOCKER=1; now unconditional — secure for every deployment
        // shape, with APPSMITH_DISABLE_SSRF_FILTER as the opt-out.)
        addDisallowedHosts(hosts, "127.0.0.1", "::1");

        return Collections.unmodifiableSet(hosts);
    }

    private static boolean computeSsrfFilterDisabled() {
        return "true".equalsIgnoreCase(System.getenv("APPSMITH_DISABLE_SSRF_FILTER"))
                || "true".equalsIgnoreCase(System.getProperty("appsmith.test.bypass.ssrf"));
    }

    /** Visible for testing only. Pairs with the {@code APPSMITH_DISABLE_SSRF_FILTER} env var. */
    public static void setSsrfFilterDisabledForTesting(boolean disabled) {
        ssrfFilterDisabled = disabled;
    }

    /**
     * Restores the SSRF-filter state to whatever the JVM env / system properties produced at
     * startup. Used by filter-testing classes in {@code @AfterAll} to undo a temporary enable
     * without hardcoding the expected default.
     */
    public static void resetSsrfFilterDisabledForTesting() {
        ssrfFilterDisabled = INITIAL_SSRF_FILTER_DISABLED;
    }

    private static void addDisallowedHosts(Set<String> hosts, String... hostCandidates) {
        for (String hostCandidate : hostCandidates) {
            try {
                hosts.add(normalizeHostForComparison(hostCandidate));
            } catch (UnknownHostException e) {
                throw new IllegalStateException("Invalid disallowed host configured: " + hostCandidate, e);
            }
        }
    }

    private static Set<String> computeInternalRedisHosts() {
        final Set<String> hosts = new HashSet<>();
        addInternalRedisHostFromEnv(hosts, "APPSMITH_REDIS_URL");
        addInternalRedisHostFromEnv(hosts, "APPSMITH_REDIS_GIT_URL");
        return hosts.isEmpty() ? Collections.emptySet() : Collections.unmodifiableSet(hosts);
    }

    private static void addInternalRedisHostFromEnv(Set<String> hosts, String envVar) {
        addInternalRedisHostFromUrl(hosts, System.getenv(envVar), envVar);
    }

    private static void addInternalRedisHostFromUrl(Set<String> hosts, String url, String sourceLabel) {
        if (!StringUtils.hasText(url)) {
            return;
        }
        try {
            final URI uri = URI.create(url.trim());
            final String host = uri.getHost();
            if (StringUtils.hasText(host)) {
                // Normalize through the same canonicalization that isHostBlocked /
                // isLiteralBlocked use for the compare side — strips IPv6 brackets, lowercases,
                // collapses IPv4-compat / IPv4-mapped IPv6 to the embedded IPv4. Without this,
                // a redis://[::1] env var stores "[::1]" but lookups canonicalize to "0.0.0.1"
                // and silently miss.
                hosts.add(normalizeHostForComparisonQuietly(host));
            }
        } catch (IllegalArgumentException e) {
            log.warn("Could not parse {} as a Redis URI; that internal Redis host won't be filtered.", sourceLabel);
        }
    }

    /**
     * Registers internal Appsmith Redis hosts from their connection URLs as resolved by the
     * application (Spring), not the process environment. The static initializer seeds
     * {@link #internalRedisHosts} from the {@code APPSMITH_REDIS_URL} / {@code APPSMITH_REDIS_GIT_URL}
     * environment variables, but the app actually binds {@code appsmith.redis.url} via Spring — which
     * can also come from {@code application.properties}, a {@code -D} system property, or a profile.
     * An operator who configures Redis through one of those (without the env var) would otherwise
     * leave this set empty, and the internal-Redis block fails open (loopback / cloud-metadata
     * literals are still blocked, but an in-cluster Redis on an RFC1918 address or service hostname
     * would be reachable). The server calls this at startup with the resolved property values so the
     * filter reflects the Redis the app truly uses, regardless of how it was configured.
     *
     * <p>Unions with — does not replace — the env-seeded set, so configuring Redis through both
     * channels blocks both. Safe to call before/after the static seed; null/blank URLs are ignored.
     */
    public static void registerInternalRedisHosts(String... redisUrls) {
        if (redisUrls == null || redisUrls.length == 0) {
            return;
        }
        final Set<String> merged = new HashSet<>(internalRedisHosts);
        for (String url : redisUrls) {
            addInternalRedisHostFromUrl(merged, url, "configured Redis URL");
        }
        internalRedisHosts = merged.isEmpty() ? Collections.emptySet() : Collections.unmodifiableSet(merged);
    }

    /** Visible for testing only. Production code never mutates the internal Redis hosts set. */
    public static void setInternalRedisHostsForTesting(String... hosts) {
        if (hosts == null || hosts.length == 0) {
            internalRedisHosts = Collections.emptySet();
            return;
        }
        final Set<String> normalized = new HashSet<>(hosts.length);
        for (String host : hosts) {
            if (StringUtils.hasText(host)) {
                // Same canonicalization as the compare side — see addInternalRedisHostFromEnv.
                normalized.add(normalizeHostForComparisonQuietly(host));
            }
        }
        internalRedisHosts = normalized.isEmpty() ? Collections.emptySet() : Collections.unmodifiableSet(normalized);
    }

    /**
     * Visible for testing only. Adds hosts that should be exempt from {@link #isHostBlocked(String)}
     * for the duration of a test run. Tests that drive Testcontainers-exposed services on loopback
     * should call this in {@code @BeforeAll} with the container's host string, then clear it with
     * {@link #clearAlwaysAllowedHostsForTesting()} in {@code @AfterAll}.
     */
    public static void setAlwaysAllowedHostsForTesting(String... hosts) {
        if (hosts == null || hosts.length == 0) {
            alwaysAllowedHostsForTesting = Collections.emptySet();
            return;
        }
        final Set<String> normalized = new HashSet<>(hosts.length);
        for (String host : hosts) {
            if (StringUtils.hasText(host)) {
                normalized.add(normalizeHostForComparisonQuietly(host));
            }
        }
        alwaysAllowedHostsForTesting = Collections.unmodifiableSet(normalized);
    }

    /** Visible for testing only. Pairs with {@link #setAlwaysAllowedHostsForTesting(String...)}. */
    public static void clearAlwaysAllowedHostsForTesting() {
        alwaysAllowedHostsForTesting = Collections.emptySet();
    }

    /**
     * Resolves a hostname and validates that none of its addresses are disallowed for
     * outbound connections from non-HTTP paths (e.g. SMTP via JavaMail). Checks against
     * the cloud-metadata denylist, loopback, link-local, any-local, multicast, and IPv6
     * Unique Local Addresses (fc00::/7). Returns the first validated resolved address so
     * callers can connect to it directly, preventing DNS-rebinding TOCTOU bypasses.
     *
     * <p>RFC 1918 site-local ranges (10/8, 172.16/12, 192.168/16) are intentionally
     * allowed because legitimate SMTP servers frequently reside on private networks.
     *
     * @return the resolved {@link InetAddress} if the host is allowed, or empty if blocked
     */
    public static Optional<InetAddress> resolveIfAllowed(String host) {
        if (!StringUtils.hasText(host)) {
            return Optional.empty();
        }

        final InetAddress[] resolved;
        try {
            resolved = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            return Optional.empty();
        }

        if (ssrfFilterDisabled || isExplicitlyAllowedForTesting(host)) {
            // Operator has opted out (or this is a test-allowlisted host) — return the resolved
            // address but skip the deny-set / address-class checks. The empty-on-unresolvable
            // contract above still holds.
            return Optional.of(resolved[0]);
        }

        final String canonicalHost = normalizeHostForComparisonQuietly(host);
        if (DISALLOWED_HOSTS.contains(canonicalHost)) {
            return Optional.empty();
        }

        for (InetAddress addr : resolved) {
            if (DISALLOWED_HOSTS.contains(normalizeHostForComparisonQuietly(addr.getHostAddress()))
                    || matchesBlockedAddressClass(addr)) {
                return Optional.empty();
            }
        }

        return Optional.of(resolved[0]);
    }

    private static boolean isExplicitlyAllowedForTesting(String host) {
        if (alwaysAllowedHostsForTesting.isEmpty() || !StringUtils.hasText(host)) {
            return false;
        }
        return alwaysAllowedHostsForTesting.contains(normalizeHostForComparisonQuietly(host));
    }

    /**
     * Returns {@code true} if {@code host} is definitively in the disallowed set: either the
     * literal/canonical host string is on the static denylist, the literal is a non-routable
     * address class (loopback, any-local, link-local, multicast, IPv6 ULA), the host matches
     * any configured internal Redis hostname (session store + git Redis), or DNS resolves it
     * to at least one address that intersects with the denylist, a blocked address class, or
     * the IPs that any configured internal Redis hostname currently resolves to.
     *
     * <p>Returns {@code false} for an unresolvable hostname so a transient DNS failure
     * doesn't reject a legitimate but temporarily unreachable host. The driver's own
     * connection-time error will surface naturally in that case.
     *
     * <p>Currently called from the Redis plugin's {@code datasourceCreate}, which is wrapped
     * in {@code Mono.fromCallable(...).subscribeOn(boundedElastic)} so the blocking DNS call
     * is safe. The other deny-list-aware paths use sibling methods:
     * {@link #isLiteralBlocked(String)} for the WebClient request-filter fast path,
     * {@link #isDisallowedAndFail(String, Promise)} for the Netty / Apache HttpAsyncClient
     * resolver hooks, and {@link #resolveIfAllowed(String)} for the SMTP test-email path.
     */
    public static boolean isHostBlocked(String host) {
        if (!StringUtils.hasText(host) || ssrfFilterDisabled || isExplicitlyAllowedForTesting(host)) {
            return false;
        }

        final String canonicalHost = normalizeHostForComparisonQuietly(host);

        if (isCanonicalHostBlocked(canonicalHost)) {
            return true;
        }

        final InetAddress[] userAddresses;
        try {
            userAddresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            // Host can't be resolved right now — don't block at save time. A truly bad host will
            // fail later at connection time with a clearer driver-specific error.
            return false;
        }

        return isAnyResolvedAddressBlocked(userAddresses);
    }

    /**
     * Shared deny-logic (1 of 2): is the canonical host string itself blocked, without any DNS?
     * Covers the static denylist (cloud-metadata literals, loopback), a non-routable IP-class
     * literal, and a literal match against an internal Appsmith Redis hostname. Extracted so
     * {@link #isHostBlocked(String)} and {@link #firstAllowedRedisAddress(String, InetAddress[])}
     * evaluate the deny list identically and cannot drift into an SSRF gap.
     */
    private static boolean isCanonicalHostBlocked(String canonicalHost) {
        return DISALLOWED_HOSTS.contains(canonicalHost)
                || isBlockedIpAddressClass(canonicalHost)
                || internalRedisHosts.contains(canonicalHost);
    }

    /**
     * Shared deny-logic (2 of 2): does any already-resolved address fall in the denylist, a
     * blocked address class, or overlap with the IPs an internal Appsmith Redis hostname currently
     * resolves to? Extracted alongside {@link #isCanonicalHostBlocked(String)} so both callers
     * share one address-level deny evaluation.
     */
    private static boolean isAnyResolvedAddressBlocked(InetAddress[] resolvedAddresses) {
        final Set<String> internalRedisIps = resolveInternalRedisIps(internalRedisHosts);
        for (InetAddress addr : resolvedAddresses) {
            final String addrString = normalizeHostForComparisonQuietly(addr.getHostAddress());
            if (DISALLOWED_HOSTS.contains(addrString)
                    || matchesBlockedAddressClass(addr)
                    || internalRedisIps.contains(addrString)) {
                return true;
            }
        }
        return false;
    }

    private static Set<String> resolveInternalRedisIps(Set<String> redisHosts) {
        if (redisHosts.isEmpty()) {
            return Collections.emptySet();
        }
        final Set<String> ips = new HashSet<>();
        for (String redisHost : redisHosts) {
            try {
                for (InetAddress addr : InetAddress.getAllByName(redisHost)) {
                    ips.add(normalizeHostForComparisonQuietly(addr.getHostAddress()));
                }
            } catch (UnknownHostException e) {
                // Hostname doesn't currently resolve — skip it in the overlap check; literal
                // match still applies for the same hostname string.
                log.debug("Internal Redis hostname {} could not be resolved; skipping in IP overlap check.", redisHost);
            }
        }
        return ips;
    }

    /**
     * Connection-time policy check for the Redis plugin's socket factory. Given a host and the
     * addresses it has ALREADY been resolved to (by the caller, in a single DNS lookup), returns
     * the first address that is safe to connect to, or empty if any resolved address is blocked —
     * static denylist (cloud-metadata literals), non-routable address class (loopback, any-local,
     * link-local, multicast, IPv6 ULA), a literal match against an internal Appsmith Redis
     * hostname, or overlap with the IPs an internal Redis hostname currently resolves to.
     *
     * <p>This is the half of the fix that closes the DNS-rebinding TOCTOU. {@link
     * #isHostBlocked(String)} resolves at datasource-create time, but Jedis would resolve the
     * hostname again when it opens the socket. {@code RestrictedHostJedisSocketFactory} (in the
     * redisPlugin module) resolves exactly once at connect time and passes those addresses here,
     * then connects directly to the returned {@link InetAddress} — so the check and the connect
     * share one resolution and the driver never re-resolves the hostname.
     *
     * <p>The caller owns DNS resolution deliberately: passing addresses in (rather than resolving
     * here) lets the caller distinguish an unresolvable host (a genuine connection error) from a
     * policy block (this method returning empty), and guarantees the validated address is the one
     * connected to. Honors the {@code APPSMITH_DISABLE_SSRF_FILTER} kill-switch and the test
     * allowlist, in which case the first resolved address is returned without policy checks.
     */
    public static Optional<InetAddress> firstAllowedRedisAddress(String host, InetAddress[] resolvedAddresses) {
        if (resolvedAddresses == null || resolvedAddresses.length == 0) {
            return Optional.empty();
        }

        if (ssrfFilterDisabled || isExplicitlyAllowedForTesting(host)) {
            return Optional.of(resolvedAddresses[0]);
        }

        final String canonicalHost = normalizeHostForComparisonQuietly(host);
        if (isCanonicalHostBlocked(canonicalHost) || isAnyResolvedAddressBlocked(resolvedAddresses)) {
            return Optional.empty();
        }

        return Optional.of(resolvedAddresses[0]);
    }

    /**
     * Best-effort, log-only description of the addresses {@code host} currently resolves to, for
     * annotating SSRF block log lines. Does its own lookup and is NOT a security decision — it only
     * explains a block, e.g. distinguishing a host typed as an internal IP literally from a hostname
     * that resolved to loopback / cloud-metadata. Returns {@code "unresolved"} when it can't be
     * resolved (the block may have fired on a literal/denylist hostname). Because it re-resolves, a
     * hostile flipping resolver could in theory report a different address than the one that
     * triggered the block; the annotation is point-in-time and diagnostic only.
     */
    public static String describeResolvedAddresses(String host) {
        try {
            return String.join(
                    ", ",
                    Arrays.stream(InetAddress.getAllByName(host))
                            .map(InetAddress::getHostAddress)
                            .toList());
        } catch (UnknownHostException e) {
            return "unresolved";
        }
    }

    /**
     * Literal/canonical-only block check — no DNS, no network I/O. Catches the static denylist
     * (cloud-metadata IPs), literal non-routable IP-class addresses, and a literal match
     * against any configured internal Redis hostname (session store + git Redis).
     *
     * <p>Returns {@code false} for unparseable input and for anything that requires DNS to
     * decide. Callers that need the DNS-resolved check (IP overlap with the internal Redis,
     * hostname-resolves-to-loopback, etc.) should use {@link #isHostBlocked(String)} from an
     * async path that tolerates blocking I/O.
     *
     * <p>Used by {@link WebClientUtils} request filter as the pre-resolver fast path — the
     * Netty resolver runs the DNS-aware check separately via
     * {@link #isDisallowedAndFail(String, Promise)}.
     */
    public static boolean isLiteralBlocked(String host) {
        if (!StringUtils.hasText(host) || ssrfFilterDisabled || isExplicitlyAllowedForTesting(host)) {
            return false;
        }
        final String canonicalHost;
        try {
            canonicalHost = normalizeHostForComparison(host);
        } catch (UnknownHostException e) {
            return false;
        }
        if (DISALLOWED_HOSTS.contains(canonicalHost) || isBlockedIpAddressClass(canonicalHost)) {
            return true;
        }
        return internalRedisHosts.contains(canonicalHost);
    }

    public static boolean isDisallowedAndFail(String host, Promise<?> promise) {
        if (ssrfFilterDisabled || isExplicitlyAllowedForTesting(host)) {
            return false;
        }
        final String canonicalHost = normalizeHostForComparisonQuietly(host);
        if (DISALLOWED_HOSTS.contains(canonicalHost) || isBlockedIpAddressClass(canonicalHost)) {
            log.warn("Host {} is disallowed. Failing the request.", host);
            if (promise != null) {
                promise.setFailure(new UnknownHostException(HOST_NOT_ALLOWED));
            }
            return true;
        }
        return false;
    }

    public static boolean isBlockedIpAddressClass(String canonicalHost) {
        if (!isValidIpAddress(canonicalHost)) {
            return false;
        }
        try {
            return matchesBlockedAddressClass(InetAddress.getByName(canonicalHost));
        } catch (UnknownHostException e) {
            return false;
        }
    }

    public static boolean matchesBlockedAddressClass(InetAddress address) {
        if (address.isLoopbackAddress()
                || address.isAnyLocalAddress()
                || address.isLinkLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }
        if (address instanceof Inet6Address) {
            // fc00::/7 — IPv6 Unique Local Addresses
            byte firstByte = address.getAddress()[0];
            return (firstByte & (byte) 0xFE) == (byte) 0xFC;
        }
        return false;
    }

    private static boolean isValidIpAddress(String host) {
        if (!StringUtils.hasText(host)) {
            return false;
        }
        host = stripHostDecorators(host);
        return inetAddressValidator.isValid(host);
    }

    static String normalizeHostForComparison(String host) throws UnknownHostException {
        if (!StringUtils.hasText(host)) {
            return host;
        }

        final String normalizedHost = stripHostDecorators(host.trim().toLowerCase(Locale.ROOT));
        return isValidIpAddress(normalizedHost) ? normalizeIpAddress(normalizedHost) : normalizedHost;
    }

    private static String normalizeHostForComparisonQuietly(String host) {
        try {
            return normalizeHostForComparison(host);
        } catch (UnknownHostException e) {
            return StringUtils.hasText(host) ? stripHostDecorators(host.trim().toLowerCase(Locale.ROOT)) : host;
        }
    }

    private static String stripHostDecorators(String host) {
        String sanitizedHost = host;
        while (sanitizedHost.endsWith(".")) {
            sanitizedHost = sanitizedHost.substring(0, sanitizedHost.length() - 1);
        }
        if (sanitizedHost.startsWith("[") && sanitizedHost.endsWith("]")) {
            sanitizedHost = sanitizedHost.substring(1, sanitizedHost.length() - 1);
        }
        return sanitizedHost;
    }

    private static String normalizeIpAddress(String host) throws UnknownHostException {
        final InetAddress address = InetAddress.getByName(host);

        if (address instanceof Inet6Address) {
            final byte[] addressBytes = address.getAddress();
            // Normalize IPv4-compatible and IPv4-mapped IPv6 literals back to the embedded IPv4 address so a single
            // denylist entry blocks equivalent literal representations such as `100.100.100.200` and
            // `[::100.100.100.200]`.
            if (isIpv4CompatibleOrMapped(addressBytes)) {
                return InetAddress.getByAddress(Arrays.copyOfRange(addressBytes, 12, 16))
                        .getHostAddress();
            }
        }

        return address.getHostAddress();
    }

    private static boolean isIpv4CompatibleOrMapped(byte[] addressBytes) {
        if (addressBytes.length != 16) {
            return false;
        }

        for (int i = 0; i < 10; i++) {
            if (addressBytes[i] != 0) {
                return false;
            }
        }

        return (addressBytes[10] == 0 && addressBytes[11] == 0)
                || (addressBytes[10] == (byte) 0xff && addressBytes[11] == (byte) 0xff);
    }
}
