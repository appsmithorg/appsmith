package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.GitAuthDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface GitArtifactHelperCE<T extends Artifact> {

    AclPermission getArtifactReadPermission();

    AclPermission getArtifactEditPermission();

    AclPermission getArtifactGitConnectPermission();

    AclPermission getArtifactAutoCommitPermission();

    AclPermission getArtifactManageProtectedBranchPermission();

    AclPermission getArtifactManageDefaultBranchPermission();

    Mono<T> getArtifactById(String artifactId, AclPermission aclPermission);

    Mono<T> getArtifactByDefaultIdAndBranchName(
            String defaultArtifactId, String branchName, AclPermission aclPermission);

    Flux<T> getAllArtifactByDefaultId(String defaultArtifactId, AclPermission aclPermission);

    Mono<GitAuthDTO> getSshKeys(String defaultArtifactId);

    Mono<T> createNewArtifactForCheckout(Artifact sourceArtifact, String branchName);

    Mono<T> saveArtifact(Artifact artifact);

    Mono<T> updateArtifactWithSchemaVersions(Artifact artifact);

    Mono<Void> updateArtifactWithProtectedBranches(String defaultArtifactId, List<String> branchNames);

    T updateArtifactWithDefaultReponseUtils(Artifact artifact);

    Flux<T> deleteAllBranches(String defaultArtifactId, List<String> branches);

    Mono<T> deleteArtifactByResource(Artifact artifact);

    void resetAttributeInDefaultArtifact(Artifact defaultArtifact);

    Mono<T> disconnectEntitiesOfDefaultArtifact(Artifact artifact);

    Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, String... args);

    Mono<Path> intialiseReadMe(Artifact artifact, Path readMePath, String originHeader) throws IOException;

    Mono<T> isPrivateRepoLimitReached(Artifact artifact, boolean isClearCache);

    Mono<T> publishArtifact(Artifact artifact);
}
