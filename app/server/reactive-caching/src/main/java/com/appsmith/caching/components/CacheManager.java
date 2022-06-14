package com.appsmith.caching.components;

import reactor.core.publisher.Mono;

public interface CacheManager {
    /**
     * This will log the cache stats with INFO severity.
     */
    void logStats();
    
    /**
     * This will get item from the cache, Mono.empty() if not found.
     * @param cacheName The name of the cache.
     * @param key The key of the item.
     * @return The Mono of the item.
     */
    Mono<Object> get(String cacheName, String key);

    /**
     * This will put item into the cache.
     * @param cacheName The name of the cache.
     * @param key The key of the item.
     * @param value The value of the item.
     * @return Mono<Boolean> true if put was successful, false otherwise.
     */
    Mono<Boolean> put(String cacheName, String key, Mono<Object> value);

    /**
     * This will remove item from the cache.
     * @param cacheName The name of the cache.
     * @param key The key of the item.
     * @return Mono<Void> that will complete after the item is removed.
     */
    Mono<Void> evict(String cacheName, String key);

    /**
     * This will remove all items from the cache.
     * @param cacheName The name of the cache.
     * @return Mono<Void> that will complete after the items are removed.
     */
    Mono<Void> evictAll(String cacheName);
}
