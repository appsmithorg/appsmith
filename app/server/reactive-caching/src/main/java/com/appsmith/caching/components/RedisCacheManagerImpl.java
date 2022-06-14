package com.appsmith.caching.components;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import com.appsmith.caching.model.CacheStats;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Component
@ConditionalOnClass({ReactiveRedisTemplate.class})
@Slf4j
public class RedisCacheManagerImpl implements CacheManager {

    private final ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;
    private final ReactiveRedisOperations<String, String> reactiveRedisOperations;
    private final String applicationName;

    Map<String, CacheStats> statsMap = new ConcurrentHashMap<>();

    private void ensureStats(String cacheName) {
        if (!statsMap.containsKey(cacheName)) {
            statsMap.put(cacheName, CacheStats.newInstance());
        }
    }

    @Override
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
    public RedisCacheManagerImpl(ReactiveRedisTemplate<String, Object> reactiveRedisTemplate, @Value("${spring.application.name}") String applicationName,
            ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        this.reactiveRedisTemplate = reactiveRedisTemplate;
        this.applicationName = applicationName;
        this.reactiveRedisOperations = reactiveRedisOperations;
    }

    @Override
    public Mono<Object> get(String cacheName, String key) {
        ensureStats(cacheName);
        String path = applicationName + ":" + cacheName + ":" + key;
        return reactiveRedisTemplate.opsForValue().get(path)
            .map(value -> {
                statsMap.get(cacheName).getHits().incrementAndGet();
                return value;
            })
            .switchIfEmpty(Mono.defer(() -> {
                statsMap.get(cacheName).getMisses().incrementAndGet();
                return Mono.empty();
            }));
    }

    @Override
    public Mono<Boolean> put(String cacheName, String key, Mono<Object> valueMono) {
        ensureStats(cacheName);
        String path = applicationName + ":" + cacheName + ":" + key;
        return valueMono.flatMap(value -> reactiveRedisTemplate.opsForValue().set(path, value));
    }

    @Override
    public Mono<Void> evict(String cacheName, String key) {
        ensureStats(cacheName);
        statsMap.get(cacheName).getSingleEvictions().incrementAndGet();
        String path = applicationName + ":" + cacheName + ":" + key;
        return reactiveRedisTemplate.delete(path).then();
    }

    @Override
    public Mono<Void> evictAll(String cacheName) {
        ensureStats(cacheName);
        statsMap.get(cacheName).getCompleteEvictions().incrementAndGet();
        String path = applicationName + ":" + cacheName;
        final String script =
            "for _,k in ipairs(redis.call('keys','" + path + ":*'))" +
                    " do redis.call('del',k) " +
                    "end";
        return reactiveRedisOperations.execute(RedisScript.of(script)).then();
    }
    
}
