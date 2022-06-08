package com.appsmith.caching.aspects;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

import com.appsmith.caching.annotations.ReactiveCacheEvict;
import com.appsmith.caching.annotations.ReactiveCacheable;
import com.appsmith.caching.components.CacheManager;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Aspect
@Configuration
@ConditionalOnClass({ReactiveRedisTemplate.class})
@Slf4j
public class ReactiveCacheAspect {

    private final CacheManager cacheManager;

    

    @Autowired
    public ReactiveCacheAspect(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    private Mono<Object> callMonoMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Mono<?>) joinPoint.proceed())
                .zipWhen(value -> cacheManager.put(cacheName, key, Mono.just(value))) //Mono<Object> -> Mono<Touple2<Object, Boolean>>
                .flatMap(value -> Mono.just(value.getT1())); //Mono<Touple2<Object, Boolean>> -> Mono<Object>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Mono.error(e);
        }
    }

    private Flux<?> callFluxMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Flux<?>) joinPoint.proceed())
                .collectList()
                .zipWhen(value -> cacheManager.put(cacheName, key, Mono.just(value))) //Flux<Object> -> Mono<Touple2<List<Object>, Boolean>>
                .flatMap(value -> Mono.just(value.getT1())) //Mono<Touple2<List<Object>, Boolean>> -> Mono<List<Object>>
                .flatMapMany(Flux::fromIterable); //Mono<List<Object>> -> Flux<Object>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Flux.error(e);
        }
    }

    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.ReactiveCacheable)")
    public Object reactiveCacheable(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        ReactiveCacheable annotation = method.getAnnotation(ReactiveCacheable.class);
        String cacheName = annotation.cacheName();
        String key = String.valueOf(Arrays.hashCode(joinPoint.getArgs()));
        Class<?> returnType = method.getReturnType();
        if (returnType.isAssignableFrom(Mono.class)) {
            return cacheManager.get(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callMonoMethodAndCache(joinPoint, cacheName, key))); //defer the creation of Mono until subscription as it will call original function
        } else if (returnType.isAssignableFrom(Flux.class)) {
            return cacheManager.get(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callFluxMethodAndCache(joinPoint, cacheName, key).collectList())) //defer the creation of Flux until subscription as it will call original function
                .map(value -> (List<?>) value)
                .flatMapMany(Flux::fromIterable);
    
        } else {
            throw new RuntimeException("non reactive object supported (Mono, Flux)");
        }
    }

    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.ReactiveCacheEvict)")
    public Object reactiveCacheEvict(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        ReactiveCacheEvict annotation = method.getAnnotation(ReactiveCacheEvict.class);
        String cacheName = annotation.cacheName();
        boolean all = annotation.all();
        Class<?> returnType = method.getReturnType();
        if (!returnType.isAssignableFrom(Mono.class)) {
            throw new RuntimeException("Just Mono<?> allowed for cacheEvict");
        }
        if(all) {
            return cacheManager.evictAll(cacheName)
                .then((Mono<?>) joinPoint.proceed());
        } else {
            String key = String.valueOf(Arrays.hashCode(joinPoint.getArgs()));
            return cacheManager.evict(cacheName, key)
                .then((Mono<?>) joinPoint.proceed());
        }
    }
}
