package com.appsmith.server.git.ce;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.git.GitArtifactTestUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
public class GitTestUtilsCE {

    private final GitArtifactTestUtils<Application> gitApplicationTestUtils;
    protected GitArtifactTestUtils<?> getArtifactSpecificUtils(ArtifactType artifactType) {
        return gitApplicationTestUtils;
    }


    public Mono<Void> createADiffInArtifact(Artifact artifact) {
        GitArtifactTestUtils<?> artifactSpecificUtils = getArtifactSpecificUtils(artifact.getArtifactType());

        return artifactSpecificUtils.createADiff(artifact);
    }
}
