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
     * Hostnames that identify the Appsmith instance itself — seeded at JVM start from the local
     * hostname ({@link InetAddress#getLocalHost()}) and the {@code HOSTNAME} environment variable.
     *
     * <p>Defense-in-depth: an instance's own routable address is typically an RFC 1918 / site-local
     * IP (Docker bridge {@code 172.17.x}, k8s pod {@code 10.x}, etc.), which the filter otherwise
     * intentionally allows so that legitimate customer datasources on private networks keep
     * working (see {@link #resolveIfAllowed(String)}). That carve-out means a user-defined
     * datasource could point at the Appsmith instance itself. Registering the instance's own
     * hostname(s) here lets the filter resolve and block just its own address(es) — via the
     * container hostname or the raw own IP — without blocking the rest of the private network.
     *
     * <p><b>Scope:</b> this is <em>best-effort</em> coverage of the address(es) the registered own
     * hostname(s) resolve to — deliberately not a full {@link java.net.NetworkInterface}
     * enumeration. A multi-homed container's secondary-interface IPs, or a deployment where the
     * hostname does not resolve to the address plugins actually connect over, are out of scope by
     * design. The primary/hostname-mapped address is the target this closes.
     *
     * <p>Hostnames are stored here; their IPs are resolved off the request hot path (at static init
     * and at {@link #registerOwnHost(String...)}, which the server runs at startup) and cached in
     * {@link #ownResolvedIps}, so the enforcement checks stay DNS-free. The own IP is effectively
     * static for the process lifetime, so a startup resolve suffices with no periodic refresh.
     *
     * <p>Volatile + public setter (for tests only) instead of {@code final} so unit tests can
     * exercise the overlap-detection logic without relying on the JVM's launch environment.
     * Production code mutates it only via {@link #registerOwnHost(String...)} at startup.
     */
    private static volatile Set<String> ownHosts = computeOwnHosts();

    /**
     * Cached IPs the registered own hostname(s) resolve to. Resolved off the request hot path —
     * once at static init and again whenever {@link #registerOwnHost(String...)} runs (the server
     * calls that at startup, before any datasource is served) — so the enforcement checks
     * ({@link #matchesOwnHost(String)} on the resolver EventLoop, and
     * {@link #isAnyResolvedAddressBlocked(InetAddress[])} on the datasource-save / Redis paths) are
     * pure set-membership with no DNS. The own IP is effectively static for the process lifetime (a
     * re-IP means a restart, which re-seeds this), so a startup resolve is sufficient and there is
     * no periodic refresh. Tests seed it directly via {@link #setOwnResolvedIpsForTesting(String...)}.
     */
    private static volatile Set<String> ownResolvedIps = resolveHostsToIps(ownHosts);

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

    private static Set<String> computeOwnHosts() {
        final Set<String> hosts = new HashSet<>();
        try {
            addOwnHostname(hosts, InetAddress.getLocalHost().getHostName());
        } catch (UnknownHostException e) {
            log.debug("Could not determine local hostname for the SSRF own-host filter; skipping the seed.");
        }
        addOwnHostname(hosts, System.getenv("HOSTNAME"));
        return hosts.isEmpty() ? Collections.emptySet() : Collections.unmodifiableSet(hosts);
    }

    private static void addOwnHostname(Set<String> hosts, String hostname) {
        if (StringUtils.hasText(hostname)) {
            // Same canonicalization as the compare side — see addInternalRedisHostFromEnv.
            hosts.add(normalizeHostForComparisonQuietly(hostname));
        }
    }

    /**
     * Registers additional hostnames that identify the Appsmith instance itself, unioning with the
     * set seeded at static init from {@link InetAddress#getLocalHost()} and the {@code HOSTNAME}
     * env var. The server calls this at startup (see {@code RedisConfig}) so the own-host block
     * reflects the running container even if the static seed missed a name (e.g. local hostname
     * resolution failed at class-load but succeeds later). Mirrors
     * {@link #registerInternalRedisHosts(String...)}: unions with — does not replace — the seed,
     * ignores null/blank entries, and is safe to call before or after the static seed.
     *
     * <p>Resolves the own hostname(s) to IPs once here — off the request hot path — and caches them
     * in {@link #ownResolvedIps}. The server calls this at startup (@PostConstruct) before any
     * datasource is served, so the resolver hooks never do DNS for the own-host check.
     */
    public static void registerOwnHost(String... hostnames) {
        if (hostnames == null || hostnames.length == 0) {
            return;
        }
        final Set<String> merged = new HashSet<>(ownHosts);
        for (String hostname : hostnames) {
            addOwnHostname(merged, hostname);
        }
        ownHosts = merged.isEmpty() ? Collections.emptySet() : Collections.unmodifiableSet(merged);
        refreshOwnResolvedIps();
    }

    /** Resolves the registered own hostnames to their current IPs and caches them. Off the hot path. */
    private static void refreshOwnResolvedIps() {
        ownResolvedIps = resolveHostsToIps(ownHosts);
    }

    /** Visible for testing only. Production code sets the own-host set via {@link #registerOwnHost}. */
    public static void setOwnHostsForTesting(String... hosts) {
        if (hosts == null || hosts.length == 0) {
            ownHosts = Collections.emptySet();
            return;
        }
        final Set<String> normalized = new HashSet<>(hosts.length);
        for (String host : hosts) {
            if (StringUtils.hasText(host)) {
                // Same canonicalization as the compare side — see addInternalRedisHostFromEnv.
                normalized.add(normalizeHostForComparisonQuietly(host));
            }
        }
        ownHosts = normalized.isEmpty() ? Collections.emptySet() : Collections.unmodifiableSet(normalized);
    }

    /**
     * Visible for testing only. Seeds the cached own-IP set directly, so the own-IP overlap can be
     * tested deterministically without DNS. Pairs with {@link #clearOwnResolvedIpsForTesting()}.
     * Production seeds this cache via {@link #registerOwnHost(String...)} at startup instead.
     */
    public static void setOwnResolvedIpsForTesting(String... ips) {
        if (ips == null || ips.length == 0) {
            ownResolvedIps = Collections.emptySet();
            return;
        }
        final Set<String> normalized = new HashSet<>(ips.length);
        for (String ip : ips) {
            if (StringUtils.hasText(ip)) {
                normalized.add(normalizeHostForComparisonQuietly(ip));
            }
        }
        ownResolvedIps = Collections.unmodifiableSet(normalized);
    }

    /** Visible for testing only. Empties the cached own-IP set. */
    public static void clearOwnResolvedIpsForTesting() {
        ownResolvedIps = Collections.emptySet();
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
     * any configured internal Redis hostname (session store + git Redis), the host is the
     * Appsmith instance's own hostname, or DNS resolves it to at least one address that
     * intersects with the denylist, a blocked address class, the IPs that any configured
     * internal Redis hostname currently resolves to, or the IPs the instance's own hostname
     * currently resolves to (defense-in-depth against a datasource targeting the instance itself).
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
     * literal, a literal match against an internal Appsmith Redis hostname, and a literal match
     * against the Appsmith instance's own hostname. Extracted so {@link #isHostBlocked(String)}
     * and {@link #firstAllowedRedisAddress(String, InetAddress[])} evaluate the deny list
     * identically and cannot drift into an SSRF gap.
     */
    private static boolean isCanonicalHostBlocked(String canonicalHost) {
        return DISALLOWED_HOSTS.contains(canonicalHost)
                || isBlockedIpAddressClass(canonicalHost)
                || internalRedisHosts.contains(canonicalHost)
                || ownHosts.contains(canonicalHost);
    }

    /**
     * Shared deny-logic (2 of 2): does any already-resolved address fall in the denylist, a
     * blocked address class, overlap with the IPs an internal Appsmith Redis hostname currently
     * resolves to, or overlap with the cached IPs the Appsmith instance's own hostname resolves to?
     * Extracted alongside {@link #isCanonicalHostBlocked(String)} so both callers share one
     * address-level deny evaluation. The own-host overlap is what blocks a datasource pointed at
     * the instance's own routable (RFC 1918) address by raw IP literal, since that address class
     * is otherwise intentionally allowed. Internal-Redis IPs are resolved live here (this method
     * only runs on the datasource-save / Redis paths, which tolerate blocking I/O); the own IPs
     * come from the {@link #ownResolvedIps} cache, shared with the resolver-hook hot path.
     */
    private static boolean isAnyResolvedAddressBlocked(InetAddress[] resolvedAddresses) {
        final Set<String> internalRedisIps = resolveHostsToIps(internalRedisHosts);
        final Set<String> ownIps = ownResolvedIps;
        for (InetAddress addr : resolvedAddresses) {
            final String addrString = normalizeHostForComparisonQuietly(addr.getHostAddress());
            if (DISALLOWED_HOSTS.contains(addrString)
                    || matchesBlockedAddressClass(addr)
                    || internalRedisIps.contains(addrString)
                    || ownIps.contains(addrString)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Address-level own-host policy shared by every enforcement entry point that works from an
     * already-canonicalized host string rather than an {@link InetAddress} array — i.e. the
     * WebClient (Netty) and Elasticsearch resolver hooks via {@link #isDisallowedAndFail(String,
     * Promise)}. Returns {@code true} when {@code canonicalHost} is a registered own hostname, or
     * equals one of the cached own IPs. Centralizing it here (alongside
     * {@link #isAnyResolvedAddressBlocked(InetAddress[])}, which applies the same own-IP overlap to
     * the datasource-save and Redis paths) keeps the resolver paths from drifting back into an
     * own-IP gap.
     *
     * <p>Pure set-membership — no DNS. The own IPs are resolved off this path (at startup /
     * {@link #registerOwnHost(String...)}) and cached in {@link #ownResolvedIps}, so this can run on
     * the Netty / Elasticsearch resolver EventLoop without blocking it. It never resolves the
     * caller's user host, so it cannot reintroduce the DNS-rebinding TOCTOU the resolver hooks exist
     * to prevent — callers hand in the address (pre- or post-DNS) they are about to use.
     */
    private static boolean matchesOwnHost(String canonicalHost) {
        return ownHosts.contains(canonicalHost) || ownResolvedIps.contains(canonicalHost);
    }

    /**
     * Resolves a set of registered hostnames (internal Redis, or — off the hot path — the instance's
     * own host) to their current IPs. Unresolvable names are skipped; a literal hostname match still
     * applies via {@link #isCanonicalHostBlocked(String)}.
     */
    private static Set<String> resolveHostsToIps(Set<String> hostsToResolve) {
        if (hostsToResolve.isEmpty()) {
            return Collections.emptySet();
        }
        final Set<String> ips = new HashSet<>();
        for (String host : hostsToResolve) {
            try {
                for (InetAddress addr : InetAddress.getAllByName(host)) {
                    ips.add(normalizeHostForComparisonQuietly(addr.getHostAddress()));
                }
            } catch (UnknownHostException e) {
                // Hostname doesn't currently resolve — skip it in the overlap check; literal
                // match still applies for the same hostname string.
                log.debug("Registered host {} could not be resolved; skipping in IP overlap check.", host);
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
     * against any configured internal Redis hostname (session store + git Redis) or the Appsmith
     * instance's own hostname.
     *
     * <p>Returns {@code false} for unparseable input and for anything that requires DNS to
     * decide. Callers that need the DNS-resolved check (IP overlap with the internal Redis or the
     * instance's own IP, hostname-resolves-to-loopback, etc.) should use {@link
     * #isHostBlocked(String)} from an async path that tolerates blocking I/O, or the resolver-hook
     * path {@link #isDisallowedAndFail(String, Promise)} which applies the own-IP overlap post-DNS.
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
        // Literal (no-DNS) block for a URL that literally names an internal Redis or the instance's
        // own host. The own-IP overlap — a hostname or raw IP that resolves to the own address — is
        // enforced by the DNS-aware resolver hook via isDisallowedAndFail, so it's intentionally not
        // resolved on this fast path (which is contractually free of DNS / network I/O).
        return internalRedisHosts.contains(canonicalHost) || ownHosts.contains(canonicalHost);
    }

    public static boolean isDisallowedAndFail(String host, Promise<?> promise) {
        if (ssrfFilterDisabled || isExplicitlyAllowedForTesting(host)) {
            return false;
        }
        final String canonicalHost = normalizeHostForComparisonQuietly(host);
        // matchesOwnHost adds the own-host literal + own-IP overlap so the WebClient (Netty) and
        // Elasticsearch resolver hooks — which call this both pre-DNS (host) and post-DNS (resolved
        // address string) — block a datasource pointed at the instance's own routable address by
        // hostname or raw IP, the same address-level policy firstAllowedRedisAddress applies. It is
        // pure set-membership against the cached own IPs (no DNS), safe to run on the resolver
        // EventLoop; the own hostnames are resolved off this path at startup (see registerOwnHost).
        if (DISALLOWED_HOSTS.contains(canonicalHost)
                || isBlockedIpAddressClass(canonicalHost)
                || matchesOwnHost(canonicalHost)) {
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
