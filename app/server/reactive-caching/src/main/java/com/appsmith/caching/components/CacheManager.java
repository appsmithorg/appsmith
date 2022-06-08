package com.appsmith.caching.components;

import reactor.core.publisher.Mono;

public interface CacheManager {
    void logStats();
    Mono<Object> get(String cacheName, String key);
    Mono<Boolean> put(String cacheName, String key, Mono<Object> value);
    Mono<Void> evict(String cacheName, String key);
    Mono<Void> evictAll(String cacheName);
}
