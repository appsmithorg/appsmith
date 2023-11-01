package com.appsmith.server.ratelimiting.domains;

import lombok.Builder;
import lombok.Data;

import java.time.Duration;

@Data
@Builder
public class RateLimit {
    private Duration refillDuration;
    private int limit;
}
