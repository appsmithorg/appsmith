package com.appsmith.server.ratelimiting;

import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.ratelimiting.ce.RateLimitServiceCEImpl;
import io.github.bucket4j.distributed.BucketProxy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class RateLimitServiceImpl extends RateLimitServiceCEImpl implements RateLimitService {

    public RateLimitServiceImpl(
            Map<String, BucketProxy> apiBuckets, RateLimitConfig rateLimitConfig, RedisUtils redisUtils) {
        super(apiBuckets, rateLimitConfig, redisUtils);
    }
}
