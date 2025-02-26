package com.appsmith.caching.aspects;

import com.appsmith.caching.annotations.DistributedLock;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Aspect
@Component
@Slf4j
public class DistributedLockAspect {

    private final ReactiveRedisOperations<String, String> redisOperations;

    private static final String LOCK_PREFIX = "lock:";

    public DistributedLockAspect(ReactiveRedisOperations<String, String> redisOperations) {
        this.redisOperations = redisOperations;
    }

    // Method to acquire a distributed lock before executing the annotated method.
    @Around("@annotation(lockAnnotation)")
    public Object around(ProceedingJoinPoint joinPoint, DistributedLock lockAnnotation) throws Throwable {
        // Check method return type
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Class<?> returnType = method.getReturnType();
        if (returnType.isAssignableFrom(Mono.class)) {
            return handleMono(joinPoint, lockAnnotation);
        } else if (returnType.isAssignableFrom(Flux.class)) {
            return handleFlux(joinPoint, lockAnnotation);
        }
        return handleBlocking(joinPoint, lockAnnotation);
    }

    private static class LockDetails {
        final String key;
        final String value;
        final Duration duration;

        LockDetails(String key, String value, Duration duration) {
            this.key = key;
            this.value = value;
            this.duration = duration;
        }
    }

    private LockDetails createLockDetails(DistributedLock lock) {
        String lockKey = LOCK_PREFIX + lock.key();
        long ttl = lock.ttl();
        String value =
                "locked until " + Instant.now().plus(ttl, ChronoUnit.SECONDS).toString();
        return new LockDetails(lockKey, value, Duration.ofSeconds(ttl));
    }

    private void releaseLock(String lockKey) {
        redisOperations
                .delete(lockKey)
                .doOnSuccess(deleted -> {
                    log.info("Released lock for: {}", lockKey);
                })
                .onErrorResume(error -> {
                    log.error("Error while releasing lock: {}", lockKey, error);
                    return Mono.empty();
                })
                .subscribeOn(Schedulers.immediate())
                .subscribe();
    }

    private Object handleMono(ProceedingJoinPoint joinPoint, DistributedLock lock) {
        LockDetails lockDetails = createLockDetails(lock);

        return redisOperations
                .opsForValue()
                .setIfAbsent(lockDetails.key, lockDetails.value, lockDetails.duration)
                .flatMap(acquired -> {
                    if (Boolean.TRUE.equals(acquired)) {
                        log.info("Acquired lock for: {}", lockDetails.key);
                        try {
                            return ((Mono<?>) joinPoint.proceed())
                                    .doOnError(error -> releaseLock(lockDetails.key))
                                    .doFinally(signalType -> {
                                        if (lock.shouldReleaseLock()) {
                                            releaseLock(lockDetails.key);
                                        }
                                    });
                        } catch (Throwable e) {
                            releaseLock(lockDetails.key);
                            return Mono.error(e);
                        }
                    }
                    log.info("Lock already acquired for: {}", lockDetails.key);
                    return Mono.empty();
                });
    }

    private Object handleFlux(ProceedingJoinPoint joinPoint, DistributedLock lock) {
        LockDetails lockDetails = createLockDetails(lock);

        return redisOperations
                .opsForValue()
                .setIfAbsent(lockDetails.key, lockDetails.value, lockDetails.duration)
                .flatMapMany(acquired -> {
                    if (Boolean.TRUE.equals(acquired)) {
                        log.info("Acquired lock for: {}", lockDetails.key);
                        try {
                            return ((Flux<?>) joinPoint.proceed())
                                    .doOnError(error -> releaseLock(lockDetails.key))
                                    .doFinally(signalType -> {
                                        if (lock.shouldReleaseLock()) {
                                            releaseLock(lockDetails.key);
                                        }
                                    });
                        } catch (Throwable e) {
                            releaseLock(lockDetails.key);
                            return Flux.error(e);
                        }
                    }
                    log.info("Lock already acquired for: {}", lockDetails.key);
                    return Flux.empty();
                });
    }

    private Object handleBlocking(ProceedingJoinPoint joinPoint, DistributedLock lock) throws Throwable {
        LockDetails lockDetails = createLockDetails(lock);

        Boolean acquired = null;
        try {
            acquired = redisOperations
                    .opsForValue()
                    .setIfAbsent(lockDetails.key, lockDetails.value, lockDetails.duration)
                    .block();
        } catch (Exception e) {
            log.error("Error while acquiring lock: {}", lockDetails.key, e);
            throw e;
        }

        if (Boolean.TRUE.equals(acquired)) {
            log.info("Acquired lock for: {}", lockDetails.key);
            try {
                return joinPoint.proceed();
            } catch (Throwable e) {
                // Always release lock on error
                releaseLock(lockDetails.key);
                throw e;
            } finally {
                if (lock.shouldReleaseLock()) {
                    releaseLock(lockDetails.key);
                }
            }
        }
        log.info("Lock already acquired for: {}", lockDetails.key);
        return null;
    }
}
