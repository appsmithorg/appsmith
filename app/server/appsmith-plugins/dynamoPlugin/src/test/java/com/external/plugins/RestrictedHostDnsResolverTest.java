package com.external.plugins;

import com.appsmith.util.RestrictedHostFilter;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.UnknownHostException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RestrictedHostDnsResolverTest {

    @BeforeAll
    static void enableRestrictedHostPolicy() {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
    }

    @AfterAll
    static void restoreRestrictedHostPolicy() {
        RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
    }

    @Test
    void should_resolveProxyHost_when_proxyHostIsLoopback() throws Exception {
        // Given
        RestrictedHostDnsResolver resolver = new RestrictedHostDnsResolver("localhost");

        // When
        InetAddress[] addresses = resolver.resolve("LOCALHOST");

        // Then
        assertThat(addresses).isNotEmpty().allMatch(InetAddress::isLoopbackAddress);
    }

    @Test
    void should_refuseHost_when_hostIsBlockedAndNotTheProxy() {
        // Given
        RestrictedHostDnsResolver resolver = new RestrictedHostDnsResolver("proxy.example.com");

        // When / Then
        assertThatThrownBy(() -> resolver.resolve("localhost"))
                .isInstanceOf(UnknownHostException.class)
                .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED);
    }

    @Test
    void should_refuseHost_when_hostIsBlockedAndNoProxyIsConfigured() {
        // Given
        RestrictedHostDnsResolver resolver = new RestrictedHostDnsResolver(null);

        // When / Then
        assertThatThrownBy(() -> resolver.resolve("127.0.0.1"))
                .isInstanceOf(UnknownHostException.class)
                .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED);
    }
}
