package com.appsmith.server.artifacts.base;

import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.GitAuthDTO;
import reactor.core.publisher.Mono;

public interface ArtifactServiceCE {

    /**
     * This method returns the appropriate ArtifactBasedService based on the type of artifact.
     */
    ArtifactBasedService<? extends Artifact> getArtifactBasedService(ArtifactType artifactType);

    /**
     * Generate SSH private and public keys required to communicate with remote. Keys will be stored only in the
     * default/root application only and not the child branched application. This decision is taken because the combined
     * size of keys is close to 4kB
     *
     * @return public key which will be used by user to copy to relevant platform
     */
    Mono<GitAuth> createOrUpdateSshKeyPair(ArtifactType artifactType, String branchedArtifactId, String keyType);

    Mono<GitAuthDTO> getSshKey(ArtifactType artifactType, String branchedArtifactId);
}
