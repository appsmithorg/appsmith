package com.external.utils;

import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.NTCredentials;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.conn.DefaultRoutePlanner;
import org.apache.http.impl.conn.DefaultSchemePortResolver;
import org.apache.http.protocol.HttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.http.apache.ProxyConfiguration;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * The proxy of an AWS SDK Apache HTTP client. The proxy comes from the https proxy settings, for every endpoint, and
 * the SDK's own proxy lookup is turned off:
 * <ul>
 *   <li>host and port: the {@code https.proxyHost} and {@code https.proxyPort} system properties, each falling back to
 *       the {@code HTTPS_PROXY} (or {@code https_proxy}) environment variable;
 *   <li>credentials: {@code https.proxyUser} and {@code https.proxyPassword}, each falling back to the user info of
 *       {@code HTTPS_PROXY};
 *   <li>hosts reached directly: {@code http.nonProxyHosts} ({@code |}-separated, {@code *} wildcards), or
 *       {@code NO_PROXY} (or {@code no_proxy}, {@code ,}-separated) when that property is unset.
 * </ul>
 * The {@code http.proxy*} properties and {@code HTTP_PROXY} are not used. A proxy is used only when a host and a
 * positive port are found. The client talks to the proxy over plain HTTP and tunnels https requests with CONNECT. The
 * proxy host is used as given, so names that are not valid URI hosts, such as {@code squid_proxy}, work; a value that
 * cannot be a host name, such as a URL, is rejected with a message that does not repeat it.
 */
final class AwsHttpsProxyConfiguration {

    static final String INVALID_PROXY_HOST_MESSAGE = "The https proxy host, from the https.proxyHost system property"
            + " or the HTTPS_PROXY environment variable, is not a valid host name.";

    static final String UNUSABLE_ENVIRONMENT_PROXY_WARNING =
            "HTTPS_PROXY is set but is not usable as an HTTP proxy (expected http://host:port); no proxy is taken from it.";

    private static final Logger log = LoggerFactory.getLogger(AwsHttpsProxyConfiguration.class);

    /** A DNS name (underscores allowed) or IPv4 address, or an IPv6 literal with optional brackets and zone. */
    private static final Pattern PROXY_HOST =
            Pattern.compile("[A-Za-z0-9._-]+|\\[?[0-9A-Fa-f.]*:[0-9A-Fa-f:.]*(%[A-Za-z0-9._-]+)?]?");

    private AwsHttpsProxyConfiguration() {}

    /** Sets the client's proxy from this JVM's system properties and environment. */
    static ApacheHttpClient.Builder configure(ApacheHttpClient.Builder builder) {
        return configure(builder, resolve(System::getProperty, System::getenv));
    }

    /** Sets the client's proxy to {@code proxy}, or to no proxy when it is null. */
    static ApacheHttpClient.Builder configure(ApacheHttpClient.Builder builder, HttpsProxy proxy) {
        builder.proxyConfiguration(ProxyConfiguration.builder()
                .useSystemPropertyValues(false)
                .useEnvironmentVariableValues(false)
                .build());
        if (proxy == null) {
            return builder;
        }
        builder.httpRoutePlanner(new HttpsProxyRoutePlanner(proxy));
        if (proxy.username() != null && proxy.password() != null) {
            BasicCredentialsProvider credentials = new BasicCredentialsProvider();
            credentials.setCredentials(
                    new AuthScope(proxy.host(), proxy.port()),
                    new NTCredentials(proxy.username(), proxy.password(), null, null));
            builder.credentialsProvider(credentials);
        }
        return builder;
    }

    /** The https proxy described by the given system properties and environment, or null when there is none. */
    static HttpsProxy resolve(UnaryOperator<String> systemProperty, UnaryOperator<String> environment) {
        URL environmentProxy = environmentProxyUrl(environment);
        String host = firstNonNull(
                systemProperty.apply("https.proxyHost"), environmentProxy == null ? null : environmentProxy.getHost());
        int port = port(systemProperty.apply("https.proxyPort"), environmentProxy);
        if (host == null || port <= 0) {
            if (environmentProxy != null) {
                log.warn(UNUSABLE_ENVIRONMENT_PROXY_WARNING);
            }
            return null;
        }
        if (!PROXY_HOST.matcher(host).matches()) {
            throw new IllegalArgumentException(INVALID_PROXY_HOST_MESSAGE);
        }

        String userInfo = environmentProxy == null ? null : environmentProxy.getUserInfo();
        String[] userInfoParts = userInfo == null ? new String[0] : userInfo.split(":", 2);
        return new HttpsProxy(
                host,
                port,
                firstNonNull(
                        systemProperty.apply("https.proxyUser"), userInfoParts.length > 0 ? userInfoParts[0] : null),
                firstNonNull(
                        systemProperty.apply("https.proxyPassword"),
                        userInfoParts.length > 1 ? userInfoParts[1] : null),
                nonProxyHostPatterns(systemProperty, environment));
    }

    /**
     * A resolved proxy. Non-proxy hosts are lower-case regular expressions in which {@code *} matches any characters.
     * {@link #toString()} shows no configured value.
     */
    record HttpsProxy(String host, int port, String username, String password, Set<String> nonProxyHostPatterns) {
        @Override
        public String toString() {
            return "HttpsProxy";
        }
    }

    /** Sends requests through the proxy unless the target host matches a non-proxy host pattern. */
    private static final class HttpsProxyRoutePlanner extends DefaultRoutePlanner {

        private final HttpHost proxy;
        private final Set<String> nonProxyHostPatterns;

        HttpsProxyRoutePlanner(HttpsProxy httpsProxy) {
            super(DefaultSchemePortResolver.INSTANCE);
            this.proxy = new HttpHost(httpsProxy.host(), httpsProxy.port(), "http");
            this.nonProxyHostPatterns = httpsProxy.nonProxyHostPatterns();
        }

        @Override
        protected HttpHost determineProxy(HttpHost target, HttpRequest request, HttpContext context) {
            String targetHost = target.getHostName().toLowerCase(Locale.ROOT);
            for (String pattern : nonProxyHostPatterns) {
                if (targetHost.matches(pattern)) {
                    return null;
                }
            }
            return proxy;
        }
    }

    /** {@code HTTPS_PROXY}, or {@code https_proxy}, as a URL; null when unset or blank, and null with a warning when it
     * is not a URL. */
    @SuppressWarnings("deprecation") // java.net.URL parsing, so values are read the same way as by the JDK.
    private static URL environmentProxyUrl(UnaryOperator<String> environment) {
        String value = environmentVariable(environment, "HTTPS_PROXY");
        if (value == null) {
            return null;
        }
        try {
            return new URL(value);
        } catch (MalformedURLException e) {
            log.warn(UNUSABLE_ENVIRONMENT_PROXY_WARNING);
            return null;
        }
    }

    /** The https.proxyPort property when it is a non-negative number, otherwise the port of {@code HTTPS_PROXY}. */
    private static int port(String property, URL environmentProxy) {
        try {
            int port = Integer.parseInt(property);
            if (port >= 0) {
                return port;
            }
        } catch (NumberFormatException e) {
            // Unset or not a number: fall back to the environment variable.
        }
        return environmentProxy == null ? -1 : environmentProxy.getPort();
    }

    private static Set<String> nonProxyHostPatterns(
            UnaryOperator<String> systemProperty, UnaryOperator<String> environment) {
        String hosts = systemProperty.apply("http.nonProxyHosts");
        if (hosts == null) {
            String noProxy = environmentVariable(environment, "NO_PROXY");
            hosts = noProxy == null ? null : noProxy.replace(",", "|");
        }
        if (hosts == null || hosts.isEmpty()) {
            return Set.of();
        }
        return Arrays.stream(hosts.split("\\|"))
                .map(entry -> entry.toLowerCase(Locale.ROOT).replace("*", ".*?"))
                .collect(Collectors.toSet());
    }

    /** The trimmed value of {@code name}, or of its lower-case form when {@code name} is unset; null when blank. */
    private static String environmentVariable(UnaryOperator<String> environment, String name) {
        String value = trimToNull(environment.apply(name));
        return value != null ? value : trimToNull(environment.apply(name.toLowerCase(Locale.ROOT)));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String firstNonNull(String first, String second) {
        return first != null ? first : second;
    }
}
