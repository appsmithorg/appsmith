package com.appsmith.profiling.model;

import java.util.concurrent.atomic.AtomicLong;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(staticName = "newInstance")
public class TimedStats {
    private AtomicLong invacations = new AtomicLong(0);
    private AtomicLong totalTime = new AtomicLong(0);
    private AtomicLong averageTime = new AtomicLong(0);
    private AtomicLong minimumTime = new AtomicLong(0);
    private AtomicLong maximumTime = new AtomicLong(0);
}
