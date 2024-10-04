package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Slf4j
@ChangeUnit(order = "063", id = "reset_session_oauth2_spring_3_3")
public class Migration063CacheBustSpringBoot3_3 {

    private final ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        final String authorizedClientsKey =
                "sessionAttr:org.springframework.security.oauth2.client.web.server.WebSessionServerOAuth2AuthorizedClientRepository.AUTHORIZED_CLIENTS";

        deleteKeysAcrossCluster("spring:session:sessions:*", authorizedClientsKey)
                .block();
    }

    public Mono<Void> deleteKeysAcrossCluster(String pattern, String hashField) {
        // Flux to scan all keys matching the pattern
        return reactiveRedisTemplate
                .scan(ScanOptions.scanOptions().match(pattern).build())
                .flatMap(key -> {
                    // Check if the hash field exists in the key's hash
                    return reactiveRedisTemplate
                            .opsForHash()
                            .hasKey(key, hashField)
                            .flatMap(fieldExists -> {
                                if (fieldExists) {
                                    // If field exists, delete the key
                                    return reactiveRedisTemplate.delete(key);
                                } else {
                                    return Mono.empty(); // Skip if the field doesn't exist
                                }
                            });
                })
                .then();
    }
}
