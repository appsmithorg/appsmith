package com.appsmith.server.artifacts.gitRoute;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.GitArtifactHelper;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public abstract class GitRouteArtifactCE {
    protected final GitArtifactHelperResolver gitArtifactHelperResolver;
    protected final ApplicationRepository applicationRepository;

    public GitRouteArtifactCE(
            ApplicationRepository applicationRepository, GitArtifactHelperResolver gitArtifactHelperResolver) {
        this.applicationRepository = applicationRepository;
        this.gitArtifactHelperResolver = gitArtifactHelperResolver;
    }

    public Mono<Artifact> getArtifact(ArtifactType artifactType, String artifactId) {
        return switch (artifactType) {
            case APPLICATION -> applicationRepository
                    .findById(artifactId)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, artifactType, artifactId)))
                    .map(app -> (Artifact) app);
            default -> Mono.error(new AppsmithException(AppsmithError.GIT_ROUTE_HANDLER_NOT_FOUND, artifactType));
        };
    }

    public GitArtifactHelper<? extends Artifact> getArtifactHelper(ArtifactType artifactType) {
        return this.gitArtifactHelperResolver.getArtifactHelper(artifactType);
    }
}
