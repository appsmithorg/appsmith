package com.appsmith.git.helpers;

import com.appsmith.util.WebClientUtils;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DSLTransformerHelper {

    private final String RTS_BASE_URL = "http:localhost:8091";

    private final WebClient webClient = WebClientUtils.create(ConnectionProvider.builder("rts-provider")
            .maxConnections(100)
            .maxIdleTime(Duration.ofSeconds(30))
            .maxLifeTime(Duration.ofSeconds(40))
            .pendingAcquireTimeout(Duration.ofSeconds(10))
            .pendingAcquireMaxCount(-1)
            .build());

    public List<JSONObject> getNormalizedDSL(JSONObject dsl) {
        return webClient.post()
                .uri(RTS_BASE_URL+ "/rts-api/v1/git/dsl/normalize")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(dsl))
                .retrieve()
                .bodyToMono(WidgetDSL.class)
                .onErrorResume(error -> {
                    log.error("Error while normalizing DSL from CS API {}", error.getMessage());
                    return Mono.error(new RuntimeException("Error while normalizing DSL from CS API"));
                })
                .block()
                .getWidgets();
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    static class WidgetDSL {
        List<JSONObject> widgets;
    }
}