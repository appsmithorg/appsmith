package com.appsmith.caching.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * This is a CacheStats class that is used to store the stats of a cache.
 * It is maintained for all cacheNames in the memory
 */
@Data
@NoArgsConstructor(staticName = "newInstance")
public class CacheStats {
    /**
     * The number of times the cache was hit.
     */
    private AtomicInteger hits = new AtomicInteger(0);

    /**
     * The number of times the cache was missed.
     */
    private AtomicInteger misses = new AtomicInteger(0);

    /**
     * The number of times the cache was evicted (single key).
     */
    private AtomicInteger singleEvictions = new AtomicInteger(0);

    /**
     * The number of times the cache was evicted (all keys).
     */
    private AtomicInteger completeEvictions = new AtomicInteger(0);
}
