package com.appsmith.server.artifacts.gitRoute;

import com.appsmith.server.repositories.ApplicationRepository;
import org.springframework.stereotype.Component;

@Component
public class GitRouteArtifact extends GitRouteArtifactCE {

    public GitRouteArtifact(ApplicationRepository applicationRepository) {
        super(applicationRepository);
    }
}
