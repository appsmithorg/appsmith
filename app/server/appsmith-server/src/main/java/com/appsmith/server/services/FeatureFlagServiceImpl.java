package com.appsmith.server.services;

import com.appsmith.server.configurations.FeatureFlagValidationContextConfig;
import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.ff4j.FF4j;
import org.springframework.stereotype.Component;

@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {

    public FeatureFlagServiceImpl(SessionUserService sessionUserService,
                                  FF4j ff4j,
                                  FeatureFlagValidationContextConfig featureFlagValidationContextConfig){

        super(sessionUserService, ff4j, featureFlagValidationContextConfig);
    }
}
