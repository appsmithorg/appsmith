package com.appsmith.server.constants;

import com.appsmith.server.ratelimiting.domains.RateLimit;

import java.time.Duration;

public class RateLimitConstants {
    public static final String RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED =
            "Your account is suspended for 24 hours. Please reset your password to continue";
    public static final String BUCKET_KEY_FOR_LOGIN_API = "login";
    public static final String BUCKET_KEY_FOR_TEST_DATASOURCE_API = "test_datasource_or_execute_query";

    public static RateLimit DEFAULT_PRESET_RATE_LIMIT_TEST_DATASOURCE_API =
            RateLimit.builder().refillDuration(Duration.ofSeconds(5)).limit(3).build();

    public static RateLimit DEFAULT_PRESET_RATE_LIMIT_LOGIN_API =
            RateLimit.builder().refillDuration(Duration.ofDays(1)).limit(5).build();

    public static RateLimit DEFAULT_MAX_RATE_LIMIT_LOGIN_API = RateLimit.builder()
            .refillDuration(Duration.ofSeconds(1))
            .limit(Integer.MAX_VALUE)
            .build();
}
