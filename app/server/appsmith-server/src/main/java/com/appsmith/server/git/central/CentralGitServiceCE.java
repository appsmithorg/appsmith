package com.appsmith.server.git.central;

import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.ce.RefType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import reactor.core.publisher.Mono;

public interface CentralGitServiceCE {

    Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId,
            GitConnectDTO gitConnectDTO,
            String originHeader,
            ArtifactType artifactType,
            GitType gitType);

    Mono<String> commitArtifact(
            CommitDTO commitDTO, String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> detachRemote(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<String> fetchRemoteChanges(
            String referenceArtifactId,
            boolean isFileLock,
            ArtifactType artifactType,
            GitType gitType,
            RefType refType);
}
