package com.appsmith.server.constants;

import com.appsmith.server.ratelimiting.domains.RateLimit;

import java.time.Duration;

public class RateLimitConstants {
    public static final String RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED =
            "Your account is suspended for 24 hours. Please reset your password to continue";
    public static final String BUCKET_KEY_FOR_LOGIN_API = "login";
    public static final String BUCKET_KEY_FOR_TEST_DATASOURCE_API = "test_datasource_or_execute_query";
    public static final Duration DEFAULT_PRESET_REFILL_DURATION_DATASOURCE_API = Duration.ofSeconds(5);
    public static final Duration DEFAULT_PRESET_REFILL_DURATION_LOGIN_API = Duration.ofDays(1);
    public static final Duration DEFAULT_MIN_REFILL_DURATION_LOGIN_API = Duration.ofNanos(1);
    public static final RateLimit DEFAULT_PRESET_RATE_LIMIT_TEST_DATASOURCE_API = RateLimit.builder()
            .refillDuration(DEFAULT_PRESET_REFILL_DURATION_DATASOURCE_API)
            .limit(3)
            .build();

    public static final RateLimit DEFAULT_PRESET_RATE_LIMIT_LOGIN_API = RateLimit.builder()
            .refillDuration(DEFAULT_PRESET_REFILL_DURATION_LOGIN_API)
            .limit(5)
            .build();

    // Bucket4j's highest supported rate is 1 token/nanosecond.
    public static final RateLimit DEFAULT_MAX_RATE_LIMIT_LOGIN_API = RateLimit.builder()
            .refillDuration(DEFAULT_MIN_REFILL_DURATION_LOGIN_API)
            .limit(1)
            .build();
}
