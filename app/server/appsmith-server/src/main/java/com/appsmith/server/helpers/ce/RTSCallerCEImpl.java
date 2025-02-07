package com.appsmith.server.helpers.ce;

import com.appsmith.external.services.ce.RTSCallerCE;
import com.appsmith.server.helpers.LogHelper;
import io.micrometer.observation.ObservationRegistry;
import jakarta.annotation.PostConstruct;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.Map;

import static com.appsmith.server.filters.MDCFilter.INTERNAL_REQUEST_ID_HEADER;
import static com.appsmith.server.filters.MDCFilter.REQUEST_ID_HEADER;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Component
public class RTSCallerCEImpl implements RTSCallerCE {

    protected final ObservationRegistry observationRegistry;

    private WebClient webClient;

    @Value("${appsmith.rts.port:}")
    protected String rtsPort;

    protected static final int MAX_IN_MEMORY_SIZE_IN_BYTES = 16 * 1024 * 1024;

    public RTSCallerCEImpl(ObservationRegistry observationRegistry) {
        this.observationRegistry = observationRegistry;
    }

    @PostConstruct
    private void makeWebClient() {
        if (isEmpty(rtsPort)) {
            rtsPort = "8091";
        }

        final ConnectionProvider connectionProvider = ConnectionProvider.builder("rts-provider")
                .maxConnections(100)
                .maxIdleTime(Duration.ofSeconds(30))
                .maxLifeTime(Duration.ofSeconds(40))
                .pendingAcquireTimeout(Duration.ofSeconds(10))
                .pendingAcquireMaxCount(-1)
                .build();

        // We do NOT use `WebClientUtils` here, intentionally, since we don't allow connections to 127.0.0.1,
        // which is exactly the _only_ host we want to hit from here.
        webClient = WebClient.builder()
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE_IN_BYTES))
                        .build())
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create(connectionProvider)))
                .baseUrl("http://127.0.0.1:" + rtsPort)
                .observationRegistry(observationRegistry)
                .build();
    }

    private Mono<WebClient.RequestBodySpec> makeRequest(HttpMethod method, String path, Object requestBody) {
        final WebClient.RequestBodySpec spec = webClient.method(method).uri(path);

        if (requestBody != null) {
            spec.contentType(MediaType.APPLICATION_JSON).body(BodyInserters.fromValue(requestBody));
        }

        return Mono.deferContextual(Mono::just).map(ctx -> {
            if (ctx.hasKey(LogHelper.CONTEXT_MAP)) {
                final Map<String, String> contextMap = ctx.get(LogHelper.CONTEXT_MAP);

                if (contextMap.containsKey(INTERNAL_REQUEST_ID_HEADER)) {
                    spec.header(INTERNAL_REQUEST_ID_HEADER, contextMap.get(INTERNAL_REQUEST_ID_HEADER));
                }

                if (contextMap.containsKey(REQUEST_ID_HEADER)) {
                    spec.header(REQUEST_ID_HEADER, contextMap.get(REQUEST_ID_HEADER));
                }
            }

            return spec;
        });
    }

    @Override
    public WebClient getWebClient() {
        return this.webClient;
    }

    @Override
    public Mono<WebClient.RequestBodySpec> get(@NonNull String path) {
        return makeRequest(HttpMethod.GET, path, null);
    }

    @Override
    public Mono<WebClient.RequestBodySpec> post(@NonNull String path, @NonNull Object requestBody) {
        return makeRequest(HttpMethod.POST, path, requestBody);
    }

    @Override
    public Mono<WebClient.RequestBodySpec> put(@NonNull String path, @NonNull Object requestBody) {
        return makeRequest(HttpMethod.PUT, path, requestBody);
    }

    @Override
    public Mono<WebClient.RequestBodySpec> delete(@NonNull String path) {
        return makeRequest(HttpMethod.DELETE, path, null);
    }
}
