package com.appsmith.server.helpers;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.helpers.ce.RTSCallerCEImpl;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Component;

@Component
public class RTSCallerImpl extends RTSCallerCEImpl implements RTSCaller {
    public RTSCallerImpl(ObservationRegistry observationRegistry) {
        super(observationRegistry);
    }
}
