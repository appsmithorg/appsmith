package com.external.utils;

import com.external.utils.AwsHttpsProxyConfiguration.HttpsProxy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

/** How the https proxy of the S3 client is read from system properties and environment variables. */
class AwsHttpsProxyConfigurationTest {

    private static final UnaryOperator<String> NOTHING_SET = name -> null;

    @ParameterizedTest
    @MethodSource("environmentOnlySettings")
    void should_resolveProxyFromHttpsSettings_when_onlyEnvironmentVariablesAreSet(
            Map<String, String> environment, String expectedHost, int expectedPort) {
        // Given
        UnaryOperator<String> environmentLookup = environment::get;

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environmentLookup);

        // Then
        assertThat(proxy.host()).isEqualTo(expectedHost);
        assertThat(proxy.port()).isEqualTo(expectedPort);
    }

    static Stream<Arguments> environmentOnlySettings() {
        return Stream.of(
                Arguments.of(Map.of("HTTPS_PROXY", "http://proxy.example:3128"), "proxy.example", 3128),
                Arguments.of(Map.of("https_proxy", "http://proxy.example:3128"), "proxy.example", 3128),
                Arguments.of(Map.of("HTTPS_PROXY", " http://proxy.example:3128 "), "proxy.example", 3128),
                Arguments.of(Map.of("HTTPS_PROXY", "http://squid_proxy:3128"), "squid_proxy", 3128));
    }

    /** No proxy is taken from an unusable HTTPS_PROXY; a warning without the value is logged instead. */
    @ParameterizedTest
    @ValueSource(strings = {"socks5://proxy.example:1080", "http://proxy.example", "proxy.example:3128"})
    void should_useNoProxy_when_httpsProxyEnvironmentVariableIsUnusable(String value) {
        // Given
        UnaryOperator<String> environment = name -> "HTTPS_PROXY".equals(name) ? value : null;
        AtomicReference<HttpsProxy> resolved = new AtomicReference<>();

        // When
        Throwable thrown =
                catchThrowable(() -> resolved.set(AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environment)));

        // Then
        assertThat(thrown).isNull();
        assertThat(resolved.get()).isNull();
    }

    @ParameterizedTest
    @MethodSource("settingsWithoutHttpsProxy")
    void should_useNoProxy_when_noHttpsProxyIsConfigured(
            Map<String, String> properties, Map<String, String> environment) {
        // Given
        UnaryOperator<String> propertyLookup = properties::get;
        UnaryOperator<String> environmentLookup = environment::get;

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(propertyLookup, environmentLookup);

        // Then
        assertThat(proxy).isNull();
    }

    static Stream<Arguments> settingsWithoutHttpsProxy() {
        return Stream.of(
                Arguments.of(Map.of(), Map.of()),
                Arguments.of(Map.of(), Map.of("HTTP_PROXY", "http://proxy.example:3128")),
                Arguments.of(Map.of("http.proxyHost", "proxy.example", "http.proxyPort", "3128"), Map.of()));
    }

    @Test
    void should_useUnderscoreProxyHost_when_setAsHttpsProxyHostProperty() {
        // Given
        Map<String, String> properties = Map.of("https.proxyHost", "squid_proxy", "https.proxyPort", "3128");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(properties::get, NOTHING_SET);

        // Then
        assertThat(proxy.host()).isEqualTo("squid_proxy");
        assertThat(proxy.port()).isEqualTo(3128);
    }

    @Test
    void should_rejectProxyHostWithoutRepeatingIt_when_httpsProxyHostIsAUrl() {
        // Given
        Map<String, String> properties =
                Map.of("https.proxyHost", "http://proxy-user:s3cret-value@proxy.example", "https.proxyPort", "3128");

        // When
        Throwable thrown = catchThrowable(() -> AwsHttpsProxyConfiguration.resolve(properties::get, NOTHING_SET));

        // Then
        assertThat(thrown)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AwsHttpsProxyConfiguration.INVALID_PROXY_HOST_MESSAGE)
                .hasNoCause();
    }

    @Test
    void should_preferHttpsProxyProperties_when_environmentVariableIsAlsoSet() {
        // Given
        Map<String, String> properties = Map.of("https.proxyHost", "property.example", "https.proxyPort", "8080");
        Map<String, String> environment = Map.of("HTTPS_PROXY", "http://env-user:env-pass@env.example:3128");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(properties::get, environment::get);

        // Then
        assertThat(proxy.host()).isEqualTo("property.example");
        assertThat(proxy.port()).isEqualTo(8080);
        assertThat(proxy.username()).isEqualTo("env-user");
        assertThat(proxy.password()).isEqualTo("env-pass");
    }

    @Test
    void should_useNoProxyEnvironmentVariable_when_nonProxyHostsPropertyIsUnset() {
        // Given
        Map<String, String> environment =
                Map.of("HTTPS_PROXY", "http://proxy.example:3128", "NO_PROXY", "localhost,*.AmazonAWS.com");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environment::get);

        // Then
        assertThat(proxy.nonProxyHostPatterns()).isEqualTo(Set.of("localhost", ".*?.amazonaws.com"));
    }

    @Test
    void should_ignoreNoProxyEnvironmentVariable_when_nonProxyHostsPropertyIsSet() {
        // Given
        Map<String, String> properties = Map.of("http.nonProxyHosts", "internal.example");
        Map<String, String> environment =
                Map.of("HTTPS_PROXY", "http://proxy.example:3128", "NO_PROXY", "*.amazonaws.com");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(properties::get, environment::get);

        // Then
        assertThat(proxy.nonProxyHostPatterns()).isEqualTo(Set.of("internal.example"));
    }

    @Test
    void should_notShowConfiguredValues_when_resolvedProxyIsPrinted() {
        // Given
        Map<String, String> environment = Map.of("HTTPS_PROXY", "http://env-user:s3cret-value@env.example:3128");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environment::get);

        // Then
        assertThat(proxy.toString()).doesNotContain("s3cret-value").doesNotContain("env.example");
    }
}
