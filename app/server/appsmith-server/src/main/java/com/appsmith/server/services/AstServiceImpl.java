package com.appsmith.server.services;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.services.ce.AstServiceCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AstServiceImpl extends AstServiceCEImpl implements AstService {

    public AstServiceImpl(
            CommonConfig commonConfig,
            InstanceConfig instanceConfig,
            RTSCaller rtsCaller,
            ObservationRegistry observationRegistry) {
        super(commonConfig, instanceConfig, rtsCaller, observationRegistry);
    }
}
