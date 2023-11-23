package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.dtos.ResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class GlobalExceptionHandlerTest {
    /*
     * test case to ensure that whenever there is appsmithPluginException on server,
     * we never expose the plugin status code directly,
     * instead we use generic 500 internal server error.
     * The actual plugin status code is visible inside response.status
     * https://github.com/appsmithorg/appsmith/pull/29009 for more context
     */
    @Test
    public void testCatchPluginException_onAppsmithPluginException_throwsInternalServerError() {
        MockServerHttpRequest httpRequest = MockServerHttpRequest.get("").build();
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
