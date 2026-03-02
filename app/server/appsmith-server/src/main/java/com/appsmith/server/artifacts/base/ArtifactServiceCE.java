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

    /**
     * Save an existing SSH key pair (generated via /import/keys) to an artifact. Keys will be stored only in the
     * default/root artifact only and not the child branched artifacts.
     * The SSH key is fetched from the database using the current user's email (from GitDeployKeysRepository).
     *
     * @param artifactType Type of artifact (APPLICATION or PACKAGE)
     * @param branchedArtifactId The artifact ID (can be base or branched artifact)
     * @return The saved artifact with updated GitAuth
     */
    Mono<? extends Artifact> saveSshKeyPair(ArtifactType artifactType, String branchedArtifactId);

    Mono<GitAuthDTO> getSshKey(ArtifactType artifactType, String branchedArtifactId);

    /**
     * Save an SSH key from the SSH Key Manager to an artifact.
     * Fetches the SSH key by ID (with access verification - owner or shared) and saves its GitAuth to the artifact.
     * Keys will be stored only in the default/root artifact.
     *
     * @param artifactType Type of artifact (APPLICATION or PACKAGE)
     * @param branchedArtifactId The artifact ID (can be base or branched artifact)
     * @param sshKeyId The ID of the SSH key from the SSH Key Manager
     * @return The saved artifact with updated GitAuth
     */
    Mono<? extends Artifact> saveSSHKeyFromManagerToArtifact(
            ArtifactType artifactType, String branchedArtifactId, String sshKeyId);
}
