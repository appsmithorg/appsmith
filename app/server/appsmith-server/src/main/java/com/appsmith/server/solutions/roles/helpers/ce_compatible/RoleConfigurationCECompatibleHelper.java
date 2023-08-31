package com.appsmith.server.solutions.roles.helpers.ce_compatible;

import reactor.core.publisher.Flux;

public interface RoleConfigurationCECompatibleHelper {
    Flux<String> getEnvironmentIdFlux(String workspaceId);
}
