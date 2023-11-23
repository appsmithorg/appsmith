package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.dtos.ResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class GlobalExceptionHandlerTest {
    // Refer issue: https://github.com/appsmithorg/appsmith/pull/29009 for more context
    @Test
    public void testCatchPluginException_onAppsmithPluginException_throwsInternalServerError() {
        LinkedMultiValueMap<String, String> mockHeaders = new LinkedMultiValueMap<>(1);
        mockHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        MockServerHttpRequest httpRequest =
                MockServerHttpRequest.get("").headers(mockHeaders).build();
        MockServerWebExchange exchange = MockServerWebExchange.from(httpRequest);

        GlobalExceptionHandler handler = new GlobalExceptionHandler(null, null, null, null);
        Mono<ResponseDTO<ErrorDTO>> exceptionHandlerMono = handler.catchPluginException(
                new AppsmithPluginException(AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR), exchange);
        StepVerifier.create(exceptionHandlerMono)
                .assertNext(response1 -> {
                    // This asserts internal status code of the response
                    assertEquals(response1.getResponseMeta().getStatus(), 401);

                    // This asserts main/external http status code of the response
                    assertEquals(exchange.getResponse().getStatusCode().is5xxServerError(), true);
                })
                .verifyComplete();
    }
}
