package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DSLMigrationUtils {

    private final CloudServicesConfig cloudServicesConfig;

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
    public Mono<Boolean> isMigrationRequired(String pageDslVersion) {
        /*webClient
        .post()
        .uri(cloudServicesConfig.getBaseUrl() + "/api/v1/migration/dsl/check")
        .contentType(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(pageDsl))
        .retrieve()
        .bodyToMono(JSONObject.class)
        .map(jsonObject -> jsonObject.get("isMigrationRequired"));*/
        return Mono.just(false);
    }

    /**
     * This method will be used to migrate the page dsl from the older version to the latest version
     * @param pageDsl List of dsl from the git file system
     * @return List of page dsl after migration
     */
    public Mono<List<String>> migratePageDsl(List<String> pageDsl) {
        /*webClient
        .post()
        .uri(cloudServicesConfig.getBaseUrl() + "/api/v1/migration/dsl/migrate")
        .contentType(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(pageDsl))
        .retrieve()
        .bodyToMono(String.class)
        .flatMap(migratedPageDsl -> Mono.just(List.of(migratedPageDsl)));*/
        return Mono.just(pageDsl);
    }
}
