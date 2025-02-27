package com.appsmith.server.aspect;

import com.appsmith.caching.annotations.DistributedLock;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class TestLockService {
    @DistributedLock(key = "mono-test")
    public Mono<String> monoOperation() {
        return Mono.just("mono-success");
    }

    @DistributedLock(key = "flux-test")
    public Flux<String> fluxOperation() {
        return Flux.just("flux-success-1", "flux-success-2");
    }

    @DistributedLock(key = "blocking-test")
    public String blockingOperation() {
        return "blocking-success";
    }

    @DistributedLock(key = "long-running-mono", ttl = 5)
    public Mono<String> longRunningMonoOperation() {
        return Mono.just("long-running-success").delayElement(Duration.ofSeconds(2));
    }

    // Test method to check when the lock is persisted after the execution
    @DistributedLock(key = "persistent-lock", shouldReleaseLock = false)
    public Mono<String> operationWithPersistentLock() {
        return Mono.just("success").delayElement(Duration.ofMillis(100));
    }

    @DistributedLock(key = "short-lived-lock", shouldReleaseLock = false, ttl = 1)
    public String operationWithShortLivedLock() {
        return "success";
    }

    // Method to manually release the lock (for testing cleanup)
    public Mono<Long> releaseLock(String lockKey, ReactiveRedisOperations<String, String> redisOperations) {
        return redisOperations.delete("lock:" + lockKey);
    }

    @DistributedLock(key = "error-lock", shouldReleaseLock = false)
    public void blockingMethodWithError() {
        throw new RuntimeException("Simulated error");
    }

    @DistributedLock(key = "error-lock", shouldReleaseLock = false)
    public Mono<String> reactiveMethodWithError() {
        return Mono.error(new RuntimeException("Simulated error"));
    }
}
