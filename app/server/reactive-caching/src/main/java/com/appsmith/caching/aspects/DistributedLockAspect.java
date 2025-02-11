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

import java.lang.reflect.Method;
import java.time.Duration;

@Aspect
@Component
@Slf4j
public class DistributedLockAspect {
    private final ReactiveRedisOperations<String, String> redisOperations;

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
        boolean isReactive = returnType.isAssignableFrom(Mono.class) || returnType.isAssignableFrom(Flux.class);
        if (isReactive) {
            // If method does returns Mono<T> or Flux<T> raise exception
            throw new IllegalAccessException(
                    "Invalid usage of @DistributedLock annotation. Only non-reactive objects are supported for locking.");
        }
        return handleBlocking(joinPoint, lockAnnotation);
    }

    private Object handleBlocking(ProceedingJoinPoint joinPoint, DistributedLock lock) throws Throwable {
        String lockKey = "lock:" + lock.key();
        long ttl = lock.ttl(); // Time-to-live for the lock
        Boolean acquired = redisOperations
                .opsForValue()
                .setIfAbsent(lockKey, "locked", Duration.ofSeconds(ttl))
                .block(); // Blocking call

        if (Boolean.TRUE.equals(acquired)) {
            try {
                return joinPoint.proceed(); // Execute method
            } finally {
                if (lock.shouldReleaseLock()) {
                    redisOperations.delete(lock.key()).block(); // Release lock
                }
            }
        } else {
            return null; // Skip execution if another pod holds the lock
        }
    }
}
