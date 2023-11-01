package com.appsmith.server.ratelimiting.services;

import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.ratelimiting.solutions.RateLimitSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class RateLimitServiceImpl extends RateLimitServiceCEImpl implements RateLimitService {

    public RateLimitServiceImpl(RedisUtils redisUtils, RateLimitSolution rateLimitSolution) {
        super(redisUtils, rateLimitSolution);
    }
}
