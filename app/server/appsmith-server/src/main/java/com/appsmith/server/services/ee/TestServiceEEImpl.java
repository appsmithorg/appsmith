package com.appsmith.server.services.ee;

import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TestService;
import com.appsmith.server.services.ce.TestServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class TestServiceEEImpl extends TestServiceCEImpl implements TestService {
    public TestServiceEEImpl(AnalyticsService analyticsService, FeatureFlagService featureFlagService) {
        super(analyticsService, featureFlagService);
    }
}
