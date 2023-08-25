package com.appsmith.server.solutions.roles.helpers;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.solutions.roles.helpers.ce_compatible.RoleConfigurationHelperCECompatibleImpl;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component
public class RoleConfigurationHelperImpl extends RoleConfigurationHelperCECompatibleImpl
        implements RoleConfigurationHelper {
    public RoleConfigurationHelperImpl(EnvironmentRepository environmentRepository) {
        super(environmentRepository);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Flux<String> getEnvironmentIdFlux(String workspaceId) {
        return Flux.empty();
    }
}
