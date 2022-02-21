package com.appsmith.server.services;

import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.ff4j.FF4j;
import org.springframework.stereotype.Component;

@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {

    public FeatureFlagServiceImpl(SessionUserService sessionUserService,
                                  FF4j ff4j) {

        super(sessionUserService, ff4j);
    }
}
