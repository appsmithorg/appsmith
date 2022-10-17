package com.appsmith.caching.components;

import com.appsmith.caching.model.CacheStats;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RedisCacheManagerImpl is a class that implements the CacheManager interface.
 * Used Redis as the cache backend.
 */
@Component
@ConditionalOnClass({ReactiveRedisTemplate.class})
@Slf4j
public class RedisCacheManagerImpl implements CacheManager {

    private final ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;
    private final ReactiveRedisOperations<String, String> reactiveRedisOperations;

    Map<String, CacheStats> statsMap = new ConcurrentHashMap<>();

    /**
     * Ensures that the key for cacheName is present in statsMap.
     * @param cacheName The name of the cache.
     */
    private void ensureStats(String cacheName) {
        if (!statsMap.containsKey(cacheName)) {
            statsMap.put(cacheName, CacheStats.newInstance());
        }
    }

    @Override
    public void logStats() {
        statsMap.keySet().forEach(key -> {
            CacheStats stats = statsMap.get(key);
            log.debug("Cache {} stats: hits = {}, misses = {}, singleEvictions = {}, completeEvictions = {}", key, stats.getHits(), stats.getMisses(), stats.getSingleEvictions(), stats.getCompleteEvictions());
        });
    }

    /**
     * Resets the stats.
     */
    public void resetStats() {
        statsMap.clear();
    }

    @Autowired
    public RedisCacheManagerImpl(ReactiveRedisTemplate<String, Object> reactiveRedisTemplate,
            ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        this.reactiveRedisTemplate = reactiveRedisTemplate;
        this.reactiveRedisOperations = reactiveRedisOperations;
    }

    @Override
    public Mono<Object> get(String cacheName, String key) {
        ensureStats(cacheName);
        String path = cacheName + ":" + key;
        return reactiveRedisTemplate.opsForValue().get(path)
            .map(value -> {
                //This is a cache hit, update stats and return value
                statsMap.get(cacheName).getHits().incrementAndGet();
                return value;
            })
            .switchIfEmpty(Mono.defer(() -> {
                //This is a cache miss, update stats and return empty
                statsMap.get(cacheName).getMisses().incrementAndGet();
                log.debug("Cache miss for key {}", path);
                return Mono.empty();
            }));
    }

    @Override
    public Mono<Boolean> put(String cacheName, String key, Object value) {
        ensureStats(cacheName);
        String path = cacheName + ":" + key;
        log.debug("Cache entry added for key {}", path);
        return reactiveRedisTemplate.opsForValue().set(path, value);
    }

    @Override
    public Mono<Void> evict(String cacheName, String key) {
        ensureStats(cacheName);
        statsMap.get(cacheName).getSingleEvictions().incrementAndGet();
        String path = cacheName + ":" + key;
        log.debug("Cache entry evicted for key {}", path);
        return reactiveRedisTemplate.delete(path).then();
    }

    @Override
    public Mono<Void> evictAll(String cacheName) {
        ensureStats(cacheName);
        statsMap.get(cacheName).getCompleteEvictions().incrementAndGet();
        String path = cacheName;
        //Remove all matching keys with wildcard
        final String script =
            "for _,k in ipairs(redis.call('keys','" + path + ":*'))" +
                    " do redis.call('del',k) " +
                    "end";
        return reactiveRedisOperations.execute(RedisScript.of(script)).then();
    }
    
}
