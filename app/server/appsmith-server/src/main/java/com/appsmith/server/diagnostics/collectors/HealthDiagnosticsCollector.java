package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.CommonConfig;
import org.springframework.stereotype.Component;

@Component
public class HealthDiagnosticsCollector extends HealthDiagnosticsCollectorCE {

    public HealthDiagnosticsCollector(
            DiagnosticsHealthIndicators healthIndicators,
            DiagnosticsLoopbackProbe loopbackProbe,
            CommonConfig commonConfig) {
        super(healthIndicators, loopbackProbe, commonConfig);
    }
}
