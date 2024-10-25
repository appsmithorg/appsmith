package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ScanOptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.ByteBuffer;

@Slf4j
@ChangeUnit(order = "063", id = "reset_session_oauth2_spring_3_3")
public class Migration063CacheBustSpringBoot3_3 {

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute(
            @Qualifier("reactiveRedisOperations") ReactiveRedisOperations<String, Object> reactiveRedisOperations) {
        scanForKeysAcrossCluster(reactiveRedisOperations, "*").block();
    }

    private Mono<Void> scanForKeysAcrossCluster(
            ReactiveRedisOperations<String, Object> reactiveRedisOperations, String pattern) {
        return reactiveRedisOperations
                .execute(connection -> {
                    Flux<ByteBuffer> scanFlux = connection
                            .keyCommands()
                            .scan(ScanOptions.scanOptions()
                                    .match(pattern)
                                    .count(1000)
                                    .build());
                    return scanFlux.flatMap(scannedKey -> {
                                return connection.keyCommands().del(scannedKey);
                            })
                            .then();
                })
                .then();
    }
}
