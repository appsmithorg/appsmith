package com.appsmith.server.solutions;

import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.EnvironmentVariableService;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DatasourceEnvironmentSolutionImpl implements DatasourceEnvironmentSolution {
    private final EnvironmentService environmentService;
    private final EnvironmentVariableService environmentVariableService;
    private final DatasourceService datasourceService;
    private final FeatureFlagService featureFlagService;
    public DatasourceEnvironmentSolutionImpl(EnvironmentService environmentService,
                                             EnvironmentVariableService environmentVariableService,
                                             @Lazy DatasourceService datasourceService,
                                             FeatureFlagService featureFlagService) {
        this.datasourceService = datasourceService;
        this.environmentService = environmentService;
        this.environmentVariableService = environmentVariableService;
        this.featureFlagService = featureFlagService;
    }
}
