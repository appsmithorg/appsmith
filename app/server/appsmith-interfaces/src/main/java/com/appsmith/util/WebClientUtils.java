package com.appsmith.util;

import io.netty.resolver.AddressResolver;
import io.netty.resolver.AddressResolverGroup;
import io.netty.resolver.InetNameResolver;
import io.netty.resolver.InetSocketAddressResolver;
import io.netty.util.concurrent.EventExecutor;
import io.netty.util.concurrent.Promise;
import io.netty.util.internal.SocketUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

public class WebClientUtils {

    private static final Set<String> DISALLOWED_HOSTS = Set.of(
            "169.254.169.254",
            "metadata.google.internal"
    );

    private WebClientUtils() {
    }

    public static WebClient create() {
        return builder()
                .build();
    }

    public static WebClient create(String baseUrl) {
        return builder()
                .baseUrl(baseUrl)
                .build();
    }

    private static boolean shouldUseSystemProxy() {
        return "true".equals(System.getProperty("java.net.useSystemProxies"))
                && (!System.getProperty("http.proxyHost", "").isEmpty() || !System.getProperty("https.proxyHost", "").isEmpty());
    }

    public static WebClient.Builder builder() {
        return builder(HttpClient.create());
    }

    public static WebClient.Builder builder(HttpClient httpClient) {
        return WebClient.builder()
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

    @Slf4j
    private static class NameResolver extends InetNameResolver {

        public NameResolver(EventExecutor executor) {
            super(executor);
        }

        private static boolean isDisallowedAndFail(String host, Promise<?> promise) {
            if (DISALLOWED_HOSTS.contains(host)) {
                log.warn("Host {} is disallowed. Failing the request.", host);
                promise.setFailure(new UnknownHostException("Host not allowed."));
                return true;
            }
            return false;
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
