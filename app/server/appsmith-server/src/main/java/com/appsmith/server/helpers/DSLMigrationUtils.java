package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.ce.DslVersionDTO;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class DSLMigrationUtils {

    private final CommonConfig commonConfig;

    private final WebClient webClient = WebClientUtils.create(ConnectionProvider.builder("rts-provider")
            .maxConnections(100)
            .maxIdleTime(Duration.ofSeconds(30))
            .maxLifeTime(Duration.ofSeconds(40))
            .pendingAcquireTimeout(Duration.ofSeconds(10))
            .pendingAcquireMaxCount(-1)
            .build());

    /**
     * This method will be used to check if the page dsl needs to be migrated or not
     * @param pageDslVersion Version number of the page dsl
     * @return If the page dsl needs to be migrated or not
     */
    private Mono<Boolean> isMigrationRequired(int pageDslVersion) {
        ParameterizedTypeReference<ResponseDTO<DslVersionDTO>> parameterizedTypeReference =
                new ParameterizedTypeReference<>() {};
        return webClient
                .get()
                .uri(commonConfig.getRtsBaseUrl() + "/rts-api/v1/dsl/version")
                .retrieve()
                .bodyToMono(parameterizedTypeReference)
                .map(responseDTO -> {
                    int latestDslVersion = responseDTO.getData().getVersion();
                    return pageDslVersion < latestDslVersion;
                });
    }

    public Mono<Integer> getLatestDslVersion() {
        ParameterizedTypeReference<ResponseDTO<DslVersionDTO>> parameterizedTypeReference =
                new ParameterizedTypeReference<>() {};
        return webClient
                .get()
                .uri(commonConfig.getRtsBaseUrl() + "/rts-api/v1/dsl/version")
                .retrieve()
                .bodyToMono(parameterizedTypeReference)
                .map(responseDTO -> responseDTO.getData().getVersion());
    }

    /**
     * This method will be used to migrate the page dsl from the older version to the latest version
     * @param pageDsl List of dsl from the git file system
     * @return List of page dsl after migration
     */
    public Mono<JSONObject> migratePageDsl(JSONObject pageDsl) {
        ParameterizedTypeReference<ResponseDTO<JSONObject>> parameterizedTypeReference =
                new ParameterizedTypeReference<>() {};

        return webClient
                .post()
                .uri(commonConfig.getRtsBaseUrl() + "/rts-api/v1/dsl/migrate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(pageDsl))
                .retrieve()
                .bodyToMono(parameterizedTypeReference)
                .map(responseDTO -> responseDTO.getData());
    }
}
