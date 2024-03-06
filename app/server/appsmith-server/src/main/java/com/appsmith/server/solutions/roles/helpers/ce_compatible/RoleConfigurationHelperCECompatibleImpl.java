package com.appsmith.server.solutions.roles.helpers.ce_compatible;

import com.appsmith.external.models.Environment;
import com.appsmith.server.repositories.EnvironmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component
@RequiredArgsConstructor
public class RoleConfigurationHelperCECompatibleImpl implements RoleConfigurationCECompatibleHelper {

    private final EnvironmentRepository environmentRepository;

    @Override
    public Flux<String> getEnvironmentIdFlux(String workspaceId) {
        return environmentRepository.findByWorkspaceId(workspaceId).map(Environment::getId);
    }
}
