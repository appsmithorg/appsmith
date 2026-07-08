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
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

/**
 * Factory for {@link WebClient} instances pre-wired with the SSRF host filter
 * ({@link RestrictedHostFilter}). The filter is enforced at two layers:
 *
 * <ol>
 *     <li>A request-stage {@link ExchangeFilterFunction} ({@link #IP_CHECK_FILTER}) that
 *     rejects literal/canonical hosts on the deny set before DNS even runs.</li>
 *     <li>A custom Netty {@link AddressResolver} ({@link ResolverGroup}) that runs DNS
 *     itself and rejects when any resolved address lands on the deny set or matches a
 *     non-routable address class.</li>
 * </ol>
 *
 * <p>Host-filter logic lives in {@link RestrictedHostFilter} so non-HTTP plugins (Redis,
 * SMTP, the Elasticsearch HttpAsyncClient hook, etc.) can call into the same denylist
 * without depending on Spring/Netty.
 */
@Slf4j
public class WebClientUtils {

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

    private static Mono<ClientRequest> requestFilterFn(ClientRequest request) {
        final String host = request.url().getHost();

        if (!StringUtils.hasText(host)) {
            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "Requested url host is null or empty"));
        }

        return RestrictedHostFilter.isLiteralBlocked(host)
                ? Mono.error(new UnknownHostException(RestrictedHostFilter.HOST_NOT_ALLOWED))
                : Mono.just(request);
    }

    private static class NameResolver extends InetNameResolver {

        public NameResolver(EventExecutor executor) {
            super(executor);
        }

        @Override
        protected void doResolve(String inetHost, Promise<InetAddress> promise) {
            if (RestrictedHostFilter.isDisallowedAndFail(inetHost, promise)) {
                return;
            }

            final InetAddress address;
            try {
                address = SocketUtils.addressByName(inetHost);
            } catch (UnknownHostException e) {
                promise.setFailure(e);
                return;
            }

            if (RestrictedHostFilter.isDisallowedAndFail(address.getHostAddress(), promise)) {
                return;
            }

            promise.setSuccess(address);
        }

        @Override
        protected void doResolveAll(String inetHost, Promise<List<InetAddress>> promise) {
            if (RestrictedHostFilter.isDisallowedAndFail(inetHost, promise)) {
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
                if (RestrictedHostFilter.isDisallowedAndFail(address.getHostAddress(), promise)) {
                    return;
                }
            }

            promise.setSuccess(addresses);
        }
    }
}
