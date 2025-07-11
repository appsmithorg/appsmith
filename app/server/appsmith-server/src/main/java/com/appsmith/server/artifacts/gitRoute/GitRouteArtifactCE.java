package com.appsmith.server.artifacts.gitRoute;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public abstract class GitRouteArtifactCE {
    protected final ApplicationRepository applicationRepository;

    public GitRouteArtifactCE(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public Mono<Artifact> getArtifact(ArtifactType artifactType, String artifactId) {
        return switch (artifactType) {
            case APPLICATION -> applicationRepository
                    .findById(artifactId)
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)))
                    .map(app -> (Artifact) app);
            default -> Mono.error(new AppsmithException(AppsmithError.GIT_ROUTE_HANDLER_NOT_FOUND, artifactType));
        };
    }
}
