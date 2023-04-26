package com.appsmith.server.filters;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.constants.Url;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.internal.stubbing.defaultanswers.ReturnsMocks;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.Mockito.verify;

public class AirgapUnsupportedPathFilterTest {

    private final AirgapInstanceConfig instanceConfig = Mockito.mock(AirgapInstanceConfig.class);

    private final WebFilterChain chain = Mockito.mock(WebFilterChain.class, new ReturnsMocks());

    private final AirgapUnsupportedPathFilter airgapFilter = new AirgapUnsupportedPathFilter(instanceConfig);

    @BeforeEach
    public void setup() {
        Mockito
            .when(instanceConfig.isAirgapEnabled())
            .thenReturn(true);
    }

    @Test
    public void airgapFilter_nonAirgapInstance_exchangeChainPassedToNextFilter() {
        // Blocking request path
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(Url.APP_TEMPLATE_URL));
        // Non-airgapped instance
        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(false);
        airgapFilter.filter(exchange, chain).block();

        // Verifying that the filter method of the next filter in the chain is called, which indicates that the request
        // was allowed
        verify(chain).filter(exchange);
    }

    @Test
    public void airgapFilter_nonBlockingPath_exchangeChainPassedToNextFilter() {

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/foo"));

        airgapFilter.filter(exchange, chain).block();

        // Verifying that the filter method of the next filter in the chain is called, which indicates that the request
        // was allowed
        verify(chain).filter(exchange);
    }

    @Test
    public void airgapFilter_blockingTemplatePath_sendBadRequestCode() {

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(Url.APP_TEMPLATE_URL));

        Mono<Void> resultMono = airgapFilter.filter(exchange, chain);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(exception -> exception instanceof AppsmithException
                && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
            .verify();
    }

    @Test
    public void airgapFilter_blockingMockDatasourcePath_sendBadRequestCode() {

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(Url.DATASOURCE_URL + Url.MOCKS));

        Mono<Void> resultMono = airgapFilter.filter(exchange, chain);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(exception -> exception instanceof AppsmithException
                && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
            .verify();
    }

    @Test
    public void airgapFilter_blockingMarketplacePath_sendBadRequestCode() {

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(Url.MARKETPLACE_URL));

        Mono<Void> resultMono = airgapFilter.filter(exchange, chain);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(exception -> exception instanceof AppsmithException
                && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
            .verify();
    }

    @Test
    public void airgapFilter_blockingUsagePulsePath_sendBadRequestCode() {

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(Url.USAGE_PULSE_URL));

        Mono<Void> resultMono = airgapFilter.filter(exchange, chain);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(exception -> exception instanceof AppsmithException
                && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
            .verify();
    }

    @Test
    public void airgapFilter_blockingReleaseItemsPath_sendBadRequestCode() {

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(Url.APPLICATION_URL + Url.RELEASE_ITEMS));

        Mono<Void> resultMono = airgapFilter.filter(exchange, chain);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(exception -> exception instanceof AppsmithException
                && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
            .verify();
    }
}
