package com.appsmith.server.services;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.ff4j.FF4j;
import org.springframework.stereotype.Component;


@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {
    public FeatureFlagServiceImpl(SessionUserService sessionUserService, FF4j ff4j, TenantService tenantService,
                                  ConfigService configService, CloudServicesConfig cloudServicesConfig) {
        super(sessionUserService, ff4j, tenantService, configService, cloudServicesConfig);
    }
}

