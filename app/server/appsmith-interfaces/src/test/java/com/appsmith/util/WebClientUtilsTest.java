package com.appsmith.util;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.ClientRequest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Method;
import java.net.URI;
import java.net.UnknownHostException;

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

    @SuppressWarnings("unchecked")
    private Mono<ClientRequest> invokeRequestFilterFn(String url) throws Exception {
        final Method method = WebClientUtils.class.getDeclaredMethod("requestFilterFn", ClientRequest.class);
        method.setAccessible(true);

        final ClientRequest request =
                ClientRequest.create(HttpMethod.GET, URI.create(url)).build();
        return (Mono<ClientRequest>) method.invoke(null, request);
    }
}
