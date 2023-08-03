package com.appsmith.server.services;

import com.appsmith.server.services.ee.TestServiceEEImpl;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
public class TestServiceImpl extends TestServiceEEImpl implements TestService {
    public TestServiceImpl(AnalyticsService analyticsService, FeatureFlagService featureFlagService) {
        super(analyticsService, featureFlagService);
    }
}
