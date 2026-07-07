package com.appsmith.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.ClientRequest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Method;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class WebClientUtilsTest {

    @ParameterizedTest
    @ValueSource(
            strings = {
                "http://100.100.100.200/latest/meta-data",
                "http://[::100.100.100.200]/latest/meta-data",
                "http://168.63.129.16/metadata/instance",
                "http://[::168.63.129.16]/metadata/instance",
                "http://169.254.10.10/latest/meta-data",
                "http://169.254.170.2/v2/metadata",
                "http://[fd20:ce::254]/computeMetadata/v1",
                "http://Metadata.TencentYun.Com./latest/meta-data"
            })
    public void testRequestFilterFnRejectsExpandedMetadataEndpoints(String url) throws Exception {
        StepVerifier.create(invokeRequestFilterFn(url))
                .expectErrorSatisfies(throwable -> {
                    assertTrue(throwable instanceof UnknownHostException);
                    assertEquals(WebClientUtils.HOST_NOT_ALLOWED, throwable.getMessage());
                })
                .verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"metadata.tencentyun.com", "Metadata.TencentYun.Com.", "METAdata.google.internal."})
    public void testIsDisallowedAndFailNormalizesMetadataHostnames(String host) {
        assertTrue(WebClientUtils.isDisallowedAndFail(host, null));
    }

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
        Optional<InetAddress> result = WebClientUtils.resolveIfAllowed(host);
        assertTrue(result.isEmpty(), "Expected host " + host + " to be blocked");
    }

    @Test
    public void resolveIfAllowed_blocksNullAndEmpty() {
        assertTrue(WebClientUtils.resolveIfAllowed(null).isEmpty());
        assertTrue(WebClientUtils.resolveIfAllowed("").isEmpty());
        assertTrue(WebClientUtils.resolveIfAllowed("  ").isEmpty());
    }

    @Test
    public void resolveIfAllowed_blocksLocalhostHostname() {
        Optional<InetAddress> result = WebClientUtils.resolveIfAllowed("localhost");
        assertTrue(result.isEmpty(), "Expected 'localhost' to be blocked");
    }

    @ParameterizedTest
    @ValueSource(strings = {"smtp.gmail.com", "email-smtp.us-east-1.amazonaws.com", "smtp.sendgrid.net"})
    public void resolveIfAllowed_allowsLegitimateSmtpHosts(String host) {
        Optional<InetAddress> result = WebClientUtils.resolveIfAllowed(host);
        assertTrue(result.isPresent(), "Expected host " + host + " to be allowed");
    }

    @Test
    public void resolveIfAllowed_blocksUnresolvableHost() {
        Optional<InetAddress> result = WebClientUtils.resolveIfAllowed("definitely-not-a-real-host-xyz123.invalid");
        assertTrue(result.isEmpty(), "Expected unresolvable host to be blocked");
    }

    @Test
    public void resolveIfAllowed_returnsResolvedAddress() {
        Optional<InetAddress> result = WebClientUtils.resolveIfAllowed("smtp.gmail.com");
        assertTrue(result.isPresent());
        assertTrue(result.get().getHostAddress().matches("\\d+\\.\\d+\\.\\d+\\.\\d+"));
    }

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
                WebClientUtils.isBlockedIpAddressClass(host),
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
                WebClientUtils.isBlockedIpAddressClass(host),
                "Did not expect " + host + " to be recognized as a blocked address class");
    }

    // GHSA-7wfp-6c63-99gq / GHSA-66gg-xpjf-p92v / GHSA-4fjr-w826-cpwm:
    // Link-local (incl. non-listed IMDS ranges), any-local, multicast, and IPv6 ULA addresses have
    // no legitimate datasource use, so they must be blocked on every deployment — not only under
    // IN_DOCKER as before. isAlwaysBlockedAddressClass is deployment-independent.
    @ParameterizedTest
    @ValueSource(
            strings = {
                // Link-local IPv4 (169.254.0.0/16) beyond the explicitly listed metadata IPs
                "169.254.1.1",
                "169.254.0.1",
                // Link-local IPv6
                "fe80::1",
                // Any-local
                "0.0.0.0",
                "::",
                // Multicast
                "224.0.0.1",
                "239.255.255.250",
                "ff02::1",
                // IPv6 ULA (fc00::/7)
                "fc00::1",
                "fd00::1",
            })
    public void isAlwaysBlockedAddressClass_recognizesNonRoutableClasses(String host) {
        assertTrue(
                WebClientUtils.isAlwaysBlockedAddressClass(host),
                "Expected " + host + " to be an always-blocked address class");
    }

    // Loopback and RFC1918 are NOT in the always-blocked set: loopback stays reachable on non-Docker
    // deployments (and localhost-backed datasources / MockWebServer tests keep working), and RFC1918
    // stays reachable so self-hosted internal datasources are unaffected. No regression by default.
    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "::1", "10.0.0.1", "192.168.1.1", "172.16.0.1", "1.1.1.1", "8.8.8.8"})
    public void isAlwaysBlockedAddressClass_doesNotMatchLoopbackPrivateOrPublic(String host) {
        assertFalse(
                WebClientUtils.isAlwaysBlockedAddressClass(host),
                "Did not expect " + host + " to be an always-blocked address class");
    }

    // The HTTP egress enforcement points (isDisallowedAndFail / requestFilterFn) must reject the
    // always-blocked classes even when IN_DOCKER is unset (the historical gap this batch closes).
    @ParameterizedTest
    @ValueSource(strings = {"169.254.1.1", "fe80::1", "0.0.0.0", "224.0.0.1", "fc00::1"})
    public void isDisallowedAndFail_blocksAlwaysBlockedClassesRegardlessOfDocker(String host) {
        assertTrue(
                WebClientUtils.isDisallowedAndFail(host, null),
                "Expected " + host + " to be blocked on all deployments");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "http://169.254.1.1/latest/meta-data",
                "http://[fe80::1]/",
                "http://0.0.0.0/",
                "http://224.0.0.1/",
            })
    public void requestFilterFn_blocksAlwaysBlockedClassesRegardlessOfDocker(String url) throws Exception {
        StepVerifier.create(invokeRequestFilterFn(url))
                .expectErrorSatisfies(throwable -> {
                    assertTrue(throwable instanceof UnknownHostException);
                    assertEquals(WebClientUtils.HOST_NOT_ALLOWED, throwable.getMessage());
                })
                .verify();
    }

    // Default posture (no IN_DOCKER, strict-egress flag off): loopback and RFC1918 remain reachable
    // so existing self-hosted internal datasources and local dev keep working (no regression).
    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "10.0.0.1", "192.168.1.1", "172.16.0.1"})
    public void isDisallowedAndFail_allowsLoopbackAndPrivateByDefault(String host) {
        assertFalse(
                WebClientUtils.isDisallowedAndFail(host, null),
                "Expected " + host + " to be allowed by default (no IN_DOCKER, strict egress off)");
    }

    // resolveForDatasource is the datasource-facing resolver used by non-HTTP plugins that connect
    // outside the WebClient pipeline (e.g. SMTP via JavaMail). It blocks the cloud-metadata denylist
    // and the always-blocked address classes on every deployment, but allows loopback and RFC1918 by
    // default so self-hosted mail servers on private networks (and Testcontainers hosts that resolve
    // to loopback on some Docker setups) keep working. It returns the resolved address so callers can
    // pin the connection and defeat DNS-rebinding.
    @ParameterizedTest
    @ValueSource(strings = {"169.254.169.254", "169.254.1.1", "0.0.0.0", "224.0.0.1", "metadata.google.internal"})
    public void resolveForDatasource_blocksMetadataAndAlwaysBlockedClasses(String host) {
        assertTrue(
                WebClientUtils.resolveForDatasource(host).isEmpty(),
                "Expected datasource host " + host + " to be blocked");
    }

    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "10.0.0.1", "192.168.1.1", "172.16.0.1"})
    public void resolveForDatasource_allowsLoopbackAndPrivateByDefault(String host) {
        assertTrue(
                WebClientUtils.resolveForDatasource(host).isPresent(),
                "Expected datasource host " + host + " to be allowed by default");
    }

    @Test
    public void resolveForDatasource_blocksNullAndEmpty() {
        assertTrue(WebClientUtils.resolveForDatasource(null).isEmpty());
        assertTrue(WebClientUtils.resolveForDatasource("  ").isEmpty());
    }

    @Test
    public void resolveForDatasource_returnsResolvedAddressForPublicHost() {
        Optional<InetAddress> result = WebClientUtils.resolveForDatasource("smtp.gmail.com");
        assertTrue(result.isPresent());
    }

    // Strict egress mode (APPSMITH_SSRF_BLOCK_PRIVATE_ADDRESS=true) additionally blocks loopback and
    // RFC1918 on all deployments. Exercised through the pure overload so no process env is mutated.
    @Test
    public void isBlockedResolvedAddress_strictMode_blocksLoopbackAndPrivate() throws Exception {
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("127.0.0.1"), false, true));
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("10.0.0.1"), false, true));
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("192.168.1.1"), false, true));
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("172.16.0.1"), false, true));
    }

    @Test
    public void isBlockedResolvedAddress_defaultMode_allowsLoopbackAndPrivate() throws Exception {
        assertFalse(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("127.0.0.1"), false, false));
        assertFalse(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("10.0.0.1"), false, false));
        assertFalse(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("192.168.1.1"), false, false));
    }

    @Test
    public void isBlockedResolvedAddress_dockerMode_blocksLoopbackButNotPrivate() throws Exception {
        // In Docker, loopback is blocked but RFC1918 stays reachable (sibling containers/services).
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("127.0.0.1"), true, false));
        assertFalse(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("10.0.0.1"), true, false));
    }

    @Test
    public void isBlockedResolvedAddress_alwaysBlocksNonRoutableClassesInEveryMode() throws Exception {
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("169.254.1.1"), false, false));
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("fe80::1"), false, false));
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("224.0.0.1"), false, false));
        assertTrue(WebClientUtils.isBlockedResolvedAddress(InetAddress.getByName("fc00::1"), false, false));
    }

    @SuppressWarnings("unchecked")
    private Mono<ClientRequest> invokeRequestFilterFn(String url) throws Exception {
        final Method method = WebClientUtils.class.getDeclaredMethod("requestFilterFn", ClientRequest.class);
        method.setAccessible(true);

        final ClientRequest request =
                ClientRequest.create(HttpMethod.GET, URI.create(url)).build();
        return (Mono<ClientRequest>) method.invoke(null, request);
    }
}
