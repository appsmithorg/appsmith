package com.appsmith.caching.model;

import java.util.concurrent.atomic.AtomicInteger;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(staticName = "newInstance")
public class CacheStats {
    private AtomicInteger hits = new AtomicInteger(0);
    private AtomicInteger misses = new AtomicInteger(0);
    private AtomicInteger singleEvictions = new AtomicInteger(0);
    private AtomicInteger completeEvictions = new AtomicInteger(0);
}
