package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.services.ce.CacheablePylonHelperCEImpl;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CacheablePylonHelperImpl extends CacheablePylonHelperCEImpl implements CacheablePylonHelper {
    public CacheablePylonHelperImpl(
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            ReleaseNotesService releaseNotesService) {
        super(configService, cloudServicesConfig, releaseNotesService);
    }
}
