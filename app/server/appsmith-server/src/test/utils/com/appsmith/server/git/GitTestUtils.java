package com.appsmith.server.git;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
public class GitTestUtils {

    private final GitArtifactTestUtils<Application> gitApplicationTestUtils;

    private GitArtifactTestUtils<?> getArtifactSpecificUtils(ArtifactType artifactType) {
        // TODO For now just work with apps
        return gitApplicationTestUtils;
    }


    public Mono<Void> createADiffInArtifact(Artifact artifact) {
        GitArtifactTestUtils<?> artifactSpecificUtils = getArtifactSpecificUtils(artifact.getArtifactType());

        return artifactSpecificUtils.createADiff(artifact);
    }
}
