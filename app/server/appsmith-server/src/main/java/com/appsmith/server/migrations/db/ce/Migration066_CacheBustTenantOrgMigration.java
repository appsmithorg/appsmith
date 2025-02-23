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
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@ChangeUnit(order = "066", id = "cache-bust-tenant-org-migration")
public class Migration066_CacheBustTenantOrgMigration {
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute(
            @Qualifier("reactiveRedisOperations") ReactiveRedisOperations<String, Object> reactiveRedisOperations) {
        log.info("Starting cache bust migration");
        scanForKeysAcrossCluster(reactiveRedisOperations, "*").block();
        log.info("Completed cache bust migration");
    }

    private Mono<Void> scanForKeysAcrossCluster(
            ReactiveRedisOperations<String, Object> reactiveRedisOperations, String pattern) {
        AtomicInteger deletedKeysCount = new AtomicInteger(0);

        return reactiveRedisOperations
                .execute(connection -> {
                    Flux<ByteBuffer> scanFlux = connection
                            .keyCommands()
                            .scan(ScanOptions.scanOptions()
                                    .match(pattern)
                                    .count(1000)
                                    .build());

                    return scanFlux.flatMap(scannedKey -> connection
                                    .keyCommands()
                                    .del(scannedKey)
                                    .doOnSuccess(result -> {
                                        int count = deletedKeysCount.incrementAndGet();
                                        if (count % 10000 == 0) {
                                            log.info("Processed {} Redis keys", count);
                                        }
                                    }))
                            .then()
                            .doOnSuccess(v -> log.info("Total Redis keys processed: {}", deletedKeysCount.get()))
                            .doOnError(error -> log.error("Redis key deletion error: {}", error.getMessage()));
                })
                .then();
    }
}
