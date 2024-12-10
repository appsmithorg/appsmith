package com.appsmith.server.git.resolver;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.git.fs.GitFSServiceImpl;
import com.appsmith.server.services.GitArtifactHelper;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class GitArtifactHelperResolverCE {

    protected final GitFSServiceImpl gitFSService;
    protected final GitArtifactHelper<Application> gitApplicationHelper;

    public GitArtifactHelper<?> getArtifactHelper(@NonNull ArtifactType artifactType) {
        return switch (artifactType) {
            case APPLICATION -> gitApplicationHelper;
            default -> gitApplicationHelper;
        };
    }
}
