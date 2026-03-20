package com.appsmith.util;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import io.netty.resolver.AddressResolver;
import io.netty.resolver.AddressResolverGroup;
import io.netty.resolver.InetNameResolver;
import io.netty.resolver.InetSocketAddressResolver;
import io.netty.util.concurrent.EventExecutor;
import io.netty.util.concurrent.Promise;
import io.netty.util.internal.SocketUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.validator.routines.InetAddressValidator;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Slf4j
public class WebClientUtils {

    private static final InetAddressValidator inetAddressValidator = InetAddressValidator.getInstance();

    private static final Set<String> DISALLOWED_HOSTS = computeDisallowedHosts();

    public static final String HOST_NOT_ALLOWED = "Host not allowed.";

    private static final int MAX_IN_MEMORY_SIZE_IN_BYTES = 16 * 1024 * 1024;

    public static final ExchangeFilterFunction IP_CHECK_FILTER =
            ExchangeFilterFunction.ofRequestProcessor(WebClientUtils::requestFilterFn);

    // Cloud Services specific configuration
    public static final Duration CLOUD_SERVICES_API_TIMEOUT = Duration.ofSeconds(60);

    // Dedicated connection pool for Cloud Services API calls to prevent connection exhaustion
    public static final ConnectionProvider CLOUD_SERVICES_CONNECTION_PROVIDER = ConnectionProvider.builder(
                    "cloud-services")
            .maxConnections(100)
            .maxIdleTime(Duration.ofSeconds(30))
            .maxLifeTime(Duration.ofSeconds(120))
            .pendingAcquireTimeout(Duration.ofSeconds(10))
            .evictInBackground(Duration.ofSeconds(150))
            .build();

    // Singleton WebClient instance for Cloud Services to avoid creating multiple instances
    private static volatile WebClient cloudServicesWebClient;

    private WebClientUtils() {}

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

        if ("1".equals(System.getenv("IN_DOCKER"))) {
            addDisallowedHosts(hosts, "127.0.0.1", "::1");
        }

        return Collections.unmodifiableSet(hosts);
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

    public static WebClient create() {
        return builder().build();
    }

    public static WebClient create(ConnectionProvider provider) {
        return builder(provider).build();
    }

    public static WebClient create(String baseUrl) {
        return builder().baseUrl(baseUrl).build();
    }

    public static WebClient create(String baseUrl, ConnectionProvider provider) {
        return builder(provider).baseUrl(baseUrl).build();
    }

    /**
     * Creates a WebClient specifically optimized for Cloud Services API calls.
     * This WebClient includes:
     * - Dedicated connection pool to prevent connection exhaustion
     * - Optimized timeouts for CS API patterns
     * - Standard IP filtering and memory limits
     *
     * Returns a singleton instance to avoid creating multiple WebClient instances.
     *
     * @return Singleton WebClient configured for Cloud Services calls
     */
    public static WebClient createForCloudServices() {
        if (cloudServicesWebClient == null) {
            synchronized (WebClientUtils.class) {
                if (cloudServicesWebClient == null) {
                    cloudServicesWebClient =
                            builder(CLOUD_SERVICES_CONNECTION_PROVIDER).build();
                }
            }
        }
        return cloudServicesWebClient;
    }

    /**
     * Gets the singleton WebClient instance for Cloud Services.
     * This is an alias for createForCloudServices() but makes the singleton nature more explicit.
     *
     * @return Singleton WebClient configured for Cloud Services calls
     */
    public static WebClient getCloudServicesWebClient() {
        return createForCloudServices();
    }

    /**
     * Resets the singleton Cloud Services WebClient instance.
     * This method is primarily intended for testing purposes.
     *
     * @deprecated This method should only be used in tests
     */
    @Deprecated
    static void resetCloudServicesWebClient() {
        synchronized (WebClientUtils.class) {
            cloudServicesWebClient = null;
        }
    }

    private static boolean shouldUseSystemProxy() {
        return "true".equals(System.getProperty("java.net.useSystemProxies"))
                && (!System.getProperty("http.proxyHost", "").isEmpty()
                        || !System.getProperty("https.proxyHost", "").isEmpty());
    }

    public static WebClient.Builder builder() {
        return builder(HttpClient.create());
    }

    public static WebClient.Builder builder(ConnectionProvider provider) {
        return builder(HttpClient.create(provider));
    }

    public static WebClient.Builder builder(HttpClient httpClient) {
        return WebClient.builder()
                .filter(IP_CHECK_FILTER)
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE_IN_BYTES))
                        .build())
                .clientConnector(new ReactorClientHttpConnector(makeSafeHttpClient(httpClient)));
    }

    private static HttpClient makeSafeHttpClient(HttpClient httpClient) {
        if (shouldUseSystemProxy()) {
            httpClient = httpClient.proxyWithSystemProperties();
        }

        return httpClient.resolver(ResolverGroup.INSTANCE);
    }

    private static class ResolverGroup extends AddressResolverGroup<InetSocketAddress> {
        public static final ResolverGroup INSTANCE = new ResolverGroup();

        @Override
        protected AddressResolver<InetSocketAddress> newResolver(EventExecutor executor) {
            return new InetSocketAddressResolver(executor, new NameResolver(executor));
        }
    }

    public static boolean isDisallowedAndFail(String host, Promise<?> promise) {
        if (DISALLOWED_HOSTS.contains(normalizeHostForComparisonQuietly(host))) {
            log.warn("Host {} is disallowed. Failing the request.", host);
            if (promise != null) {
                promise.setFailure(new UnknownHostException(HOST_NOT_ALLOWED));
            }
            return true;
        }
        return false;
    }

    private static Mono<ClientRequest> requestFilterFn(ClientRequest request) {
        final String host = request.url().getHost();

        if (!StringUtils.hasText(host)) {
            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "Requested url host is null or empty"));
        }

        final String canonicalHost;
        try {
            canonicalHost = normalizeHostForComparison(host);
        } catch (UnknownHostException e) {
            // This exception is thrown, if the given host couldn't be resolved to an IP address. But, since we only
            // canonicalize after ensuring that `host` is a valid IP address, this exception should never occur.
            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "IP Address resolution is invalid"));
        }

        return DISALLOWED_HOSTS.contains(canonicalHost)
                ? Mono.error(new UnknownHostException(HOST_NOT_ALLOWED))
                : Mono.just(request);
    }

    private static boolean isValidIpAddress(String host) {
        if (!StringUtils.hasText(host)) {
            return false;
        }
        host = stripHostDecorators(host);
        return inetAddressValidator.isValid(host);
    }

    private static String normalizeHostForComparison(String host) throws UnknownHostException {
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

    private static class NameResolver extends InetNameResolver {

        public NameResolver(EventExecutor executor) {
            super(executor);
        }

        @Override
        protected void doResolve(String inetHost, Promise<InetAddress> promise) {
            if (isDisallowedAndFail(inetHost, promise)) {
                return;
            }

            final InetAddress address;
            try {
                address = SocketUtils.addressByName(inetHost);
            } catch (UnknownHostException e) {
                promise.setFailure(e);
                return;
            }

            if (isDisallowedAndFail(address.getHostAddress(), promise)) {
                return;
            }

            promise.setSuccess(address);
        }

        @Override
        protected void doResolveAll(String inetHost, Promise<List<InetAddress>> promise) {
            if (isDisallowedAndFail(inetHost, promise)) {
                return;
            }

            final List<InetAddress> addresses;
            try {
                addresses = Arrays.asList(SocketUtils.allAddressesByName(inetHost));
            } catch (UnknownHostException e) {
                promise.setFailure(e);
                return;
            }

            // Even if _one_ of the addresses is disallowed, we fail the request.
            for (InetAddress address : addresses) {
                if (isDisallowedAndFail(address.getHostAddress(), promise)) {
                    return;
                }
            }

            promise.setSuccess(addresses);
        }
    }
}
