package com.appsmith.server.ratelimiting.solutions;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.server.ratelimiting.configuration.ProxyManagerConfiguration;
import org.springframework.stereotype.Component;

@Component
public class RateLimitSolutionImpl extends RateLimitSolutionCEImpl implements RateLimitSolution {
    public RateLimitSolutionImpl(ProxyManagerConfiguration proxyManagerConfiguration, CacheManager cacheManager) {
        super(proxyManagerConfiguration, cacheManager);
    }
}
