package com.appsmith.caching.aspects;

import com.appsmith.caching.annotations.DistributedLock;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Aspect
@Component
@Slf4j
public class DistributedLockAspect {

    private final RedisOperations<String, String> redisOperations;

    private static final String LOCK_PREFIX = "lock:";

    public DistributedLockAspect(RedisOperations<String, String> redisOperations) {
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
            // Locking for reactive methods can be added with reactive Redis operations if needed.
            throw new IllegalAccessException(
                    "Invalid usage of @DistributedLock annotation. Only non-reactive methods are supported for locking.");
        }
        return handleBlocking(joinPoint, lockAnnotation);
    }

    private Object handleBlocking(ProceedingJoinPoint joinPoint, DistributedLock lock) throws Throwable {
        String lockKey = LOCK_PREFIX + lock.key();
        long ttl = lock.ttl(); // Time-to-live for the lock
        String value = "locked until "
                + Instant.now().plus(ttl, ChronoUnit.SECONDS).toString(); // Value to set in the lock key
        Boolean acquired = redisOperations.opsForValue().setIfAbsent(lockKey, value, Duration.ofSeconds(ttl));

        if (Boolean.TRUE.equals(acquired)) {
            try {
                return joinPoint.proceed(); // Execute method
            } finally {
                if (lock.shouldReleaseLock()) {
                    redisOperations.delete(lock.key()); // Release lock
                }
            }
        } else {
            return null; // Skip execution if another pod holds the lock
        }
    }
}
