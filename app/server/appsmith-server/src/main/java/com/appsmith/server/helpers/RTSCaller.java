package com.appsmith.server.helpers;

import com.appsmith.util.WebClientUtils;
import jakarta.annotation.PostConstruct;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.Map;

import static com.appsmith.server.filters.MDCFilter.INTERNAL_REQUEST_ID_HEADER;
import static com.appsmith.server.filters.MDCFilter.REQUEST_ID_HEADER;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Component
public class RTSCaller {

    private WebClient webClient;

    @Value("${appsmith.rts.port:}")
    private String rtsPort;

    @PostConstruct
    private void makeWebClient() {
        if (isEmpty(rtsPort)) {
            rtsPort = "8091";
        }

        webClient = WebClientUtils.builder(ConnectionProvider.builder("rts-provider")
                        .maxConnections(100)
                        .maxIdleTime(Duration.ofSeconds(30))
                        .maxLifeTime(Duration.ofSeconds(40))
                        .pendingAcquireTimeout(Duration.ofSeconds(10))
                        .pendingAcquireMaxCount(-1)
                        .build())
                .baseUrl("http://127.0.0.1:" + rtsPort)
                .build();
    }

    private Mono<WebClient.ResponseSpec> makeRequest(HttpMethod method, String path, Object requestBody) {
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

            return spec.retrieve();
        });
    }

    public Mono<WebClient.ResponseSpec> get(@NonNull String path) {
        return makeRequest(HttpMethod.GET, path, null);
    }

    public Mono<WebClient.ResponseSpec> post(@NonNull String path, @NonNull Object requestBody) {
        return makeRequest(HttpMethod.POST, path, requestBody);
    }
}
