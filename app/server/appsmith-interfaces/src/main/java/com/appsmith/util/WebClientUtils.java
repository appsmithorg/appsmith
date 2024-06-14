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

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
public class WebClientUtils {

    private static final Set<String> DISALLOWED_HOSTS = computeDisallowedHosts();

    public static final String HOST_NOT_ALLOWED = "Host not allowed.";

    private static final int MAX_IN_MEMORY_SIZE_IN_BYTES = 16 * 1024 * 1024;

    private static final InetAddressValidator inetAddressValidator = InetAddressValidator.getInstance();

    public static final ExchangeFilterFunction IP_CHECK_FILTER =
            ExchangeFilterFunction.ofRequestProcessor(WebClientUtils::requestFilterFn);

    private WebClientUtils() {}

    private static Set<String> computeDisallowedHosts() {
        final Set<String> hosts = new HashSet<>(Set.of(
                "169.254.169.254", "0:0:0:0:0:0:a9fe:a9fe", "fd00:ec2:0:0:0:0:0:254", "metadata.google.internal"));

        if ("1".equals(System.getenv("IN_DOCKER"))) {
            hosts.add("127.0.0.1");
            hosts.add("0:0:0:0:0:0:0:1");
        }

        return Collections.unmodifiableSet(hosts);
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
        if (DISALLOWED_HOSTS.contains(host)) {
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

        String canonicalHost = host;
        if (isValidIpAddress(host)) {
            try {
                // This is to ensure we have the canonical representation of the IP Address. For example,
                //   - `10.4` and `10.0.0.4` represent the same IPv4 address.
                //   - `::1` and `0:0:0:0:0:0:0:1` represent the same IPv6 address.
                //   - `::a9fe:a9fe`, `0:0:0:0:0:0:a9fe:a9fe` and `[::169.254.169.254]` all represent the same IPv4
                // address in IPv6 notation.
                // Getting the canonical form makes the check for disallowed hosts more resilient.
                canonicalHost = InetAddress.getByName(host).getHostAddress();
            } catch (UnknownHostException e) {
                // This exception is thrown, if the given host couldn't be resolved to an IP address. But, since we only
                // call this method after ensuring that `host` is a valid IP address, this exception should never occur.
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "IP Address resolution is invalid"));
            }
        }

        return DISALLOWED_HOSTS.contains(canonicalHost)
                ? Mono.error(new UnknownHostException(HOST_NOT_ALLOWED))
                : Mono.just(request);
    }

    private static boolean isValidIpAddress(String host) {
        if (!StringUtils.hasText(host)) {
            return false;
        }
        if (host.startsWith("[") && host.endsWith("]")) {
            host = host.substring(1, host.length() - 1);
        }
        return inetAddressValidator.isValid(host);
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
