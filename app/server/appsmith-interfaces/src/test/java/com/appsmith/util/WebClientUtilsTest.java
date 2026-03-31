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

    @SuppressWarnings("unchecked")
    private Mono<ClientRequest> invokeRequestFilterFn(String url) throws Exception {
        final Method method = WebClientUtils.class.getDeclaredMethod("requestFilterFn", ClientRequest.class);
        method.setAccessible(true);

        final ClientRequest request =
                ClientRequest.create(HttpMethod.GET, URI.create(url)).build();
        return (Mono<ClientRequest>) method.invoke(null, request);
    }
}
