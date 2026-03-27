package com.appsmith.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.ClientRequest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Method;
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
                "10.0.0.1",
                "192.168.1.1",
                "172.16.0.1",
                "169.254.169.254",
                "169.254.10.10",
                "100.100.100.200",
                "168.63.129.16",
                "0.0.0.0",
            })
    public void validateHostNotDisallowed_blocksPrivateAndMetadataHosts(String host) {
        Optional<String> result = WebClientUtils.validateHostNotDisallowed(host);
        assertTrue(result.isPresent(), "Expected host " + host + " to be blocked");
    }

    @Test
    public void validateHostNotDisallowed_blocksNullAndEmpty() {
        assertTrue(WebClientUtils.validateHostNotDisallowed(null).isPresent());
        assertTrue(WebClientUtils.validateHostNotDisallowed("").isPresent());
        assertTrue(WebClientUtils.validateHostNotDisallowed("  ").isPresent());
    }

    @Test
    public void validateHostNotDisallowed_blocksLocalhostHostname() {
        Optional<String> result = WebClientUtils.validateHostNotDisallowed("localhost");
        assertTrue(result.isPresent(), "Expected 'localhost' to be blocked");
    }

    @ParameterizedTest
    @ValueSource(strings = {"smtp.gmail.com", "email-smtp.us-east-1.amazonaws.com", "smtp.sendgrid.net"})
    public void validateHostNotDisallowed_allowsLegitimateSmtpHosts(String host) {
        Optional<String> result = WebClientUtils.validateHostNotDisallowed(host);
        assertTrue(result.isEmpty(), "Expected host " + host + " to be allowed, but got: " + result.orElse(""));
    }

    @Test
    public void validateHostNotDisallowed_blocksUnresolvableHost() {
        Optional<String> result = WebClientUtils.validateHostNotDisallowed("definitely-not-a-real-host-xyz123.invalid");
        assertTrue(result.isPresent(), "Expected unresolvable host to be blocked");
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
