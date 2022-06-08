package com.appsmith.caching.aspects;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import com.appsmith.caching.annotations.ReactiveCacheEvict;
import com.appsmith.caching.annotations.ReactiveCacheable;
import com.appsmith.caching.model.CacheStats;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.val;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Aspect
@Configuration
@ConditionalOnClass({ReactiveRedisTemplate.class})
@Slf4j
public class ReactiveCacheAspect {

    private final ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;
    private final ReactiveRedisOperations<String, String> reactiveRedisOperations;
    private final String applicationName;
    private final ObjectMapper objectMapper;

    Map<String, CacheStats> statsMap = new ConcurrentHashMap<>();

    private void ensureStats(String cacheName) {
        if (!statsMap.containsKey(cacheName)) {
            statsMap.put(cacheName, CacheStats.newInstance());
        }
    }

    public void logStats() {
        statsMap.keySet().forEach(key -> {
            CacheStats stats = statsMap.get(key);
            log.info("Cache {} stats: hits = {}, misses = {}, singleEvictions = {}, completeEvictions = {}", key, stats.getHits(), stats.getMisses(), stats.getSingleEvictions(), stats.getCompleteEvictions());
        });
    }

    public void resetStats() {
        statsMap.clear();
    }

    @Autowired
    public ReactiveCacheAspect(ReactiveRedisTemplate<String, Object> reactiveRedisTemplate, @Value("${spring.application.name}") String applicationName,
            ReactiveRedisOperations<String, String> reactiveRedisOperations, ObjectMapper objectMapper) {
        this.reactiveRedisTemplate = reactiveRedisTemplate;
        this.applicationName = applicationName;
        this.reactiveRedisOperations = reactiveRedisOperations;
        this.objectMapper = objectMapper;
    }

    private Mono<Object> callMonoMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            statsMap.get(cacheName).getMisses().incrementAndGet();
            return ((Mono<?>) joinPoint.proceed())
                .zipWhen(value -> reactiveRedisTemplate.opsForValue().set(key, value)) //Mono<Object> -> Mono<Touple2<Object, Boolean>>
                .flatMap(value -> Mono.just(value.getT1())); //Mono<Touple2<Object, Boolean>> -> Mono<Object>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Mono.error(e);
        }
    }

    private Flux<Object> callFluxMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            statsMap.get(cacheName).getMisses().incrementAndGet();
            return ((Flux<?>) joinPoint.proceed())
                .collectList() //Flux<Object> -> Mono<List<Object>>
                .zipWhen(value -> reactiveRedisTemplate.opsForValue().set(key, value)) //Mono<List<Object>> -> Mono<Touple2<List<Object>, Boolean>>
                .flatMap(value -> Mono.just(value.getT1())) //Mono<Touple2<List<Object>, Boolean>> -> Mono<List<Object>>
                .flatMapMany(Flux::fromIterable); //Mono<List<Object>> -> Flux<Object>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Flux.error(e);
        }
    }

    private Mono<Object> fetchMonoFromCache(String cacheName, String key) {
        return reactiveRedisTemplate.opsForValue().get(key)
            .map(value -> {
                statsMap.get(cacheName).getHits().incrementAndGet();
                return value;
            });
    }

    private Flux<Object> fetchFluxFromCache(String cacheName, String key) {
        return reactiveRedisTemplate.opsForValue().get(key)
            .map(value -> {
                statsMap.get(cacheName).getHits().incrementAndGet();
                return value;
            })
            .map(list -> ((List<?>)list)) //Mono<Object> -> Mono<List<Object>>
            .flatMapMany(Flux::fromIterable); //Mono<List<Object>> -> Flux<Object>
    }

    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.ReactiveCacheable)")
    public Object reactiveCacheable(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        ReactiveCacheable annotation = method.getAnnotation(ReactiveCacheable.class);
        String cacheName = annotation.cacheName();
        String key = applicationName + ':' + cacheName + ':' + Arrays.hashCode(joinPoint.getArgs());
        Class<?> returnType = method.getReturnType();
        log.trace("Cacheable method {} with key {}", joinPoint.getSignature().getName(), key);
        ensureStats(cacheName);
        if (returnType.isAssignableFrom(Mono.class)) {
            return fetchMonoFromCache(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callMonoMethodAndCache(joinPoint, cacheName, key))); //defer the creation of Mono until subscription as it will call original function
        } else if (returnType.isAssignableFrom(Flux.class)) {
            return fetchFluxFromCache(cacheName, key)
                .switchIfEmpty(Flux.defer(() -> callFluxMethodAndCache(joinPoint, cacheName, key))); //defer the creation of Flux until subscription as it will call original function
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
        String key = applicationName + ':' + cacheName + ':' + Arrays.hashCode(joinPoint.getArgs());
        Class<?> returnType = method.getReturnType();
        if (!returnType.isAssignableFrom(Mono.class)) {
            throw new RuntimeException("Just Mono<?> allowed for cacheEvict");
        }
        ensureStats(cacheName);
        if(all) {
            final String script =
            "for _,k in ipairs(redis.call('keys','" + applicationName + ':' + cacheName + ":*'))" +
                    " do redis.call('del',k) " +
                    "end";
            statsMap.get(cacheName).getCompleteEvictions().incrementAndGet();
            return reactiveRedisOperations.execute(RedisScript.of(script)).then((Mono<?>) joinPoint.proceed());
        } else {
            statsMap.get(cacheName).getSingleEvictions().incrementAndGet();
            return reactiveRedisTemplate.delete(key).then((Mono<?>) joinPoint.proceed());
        }
    }
}
