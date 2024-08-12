package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
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

    Mono<T> getArtifactByBaseIdAndBranchName(String baseArtifactId, String branchName, AclPermission aclPermission);

    Flux<T> getAllArtifactByBaseId(String baseArtifactId, AclPermission aclPermission);

    Mono<GitAuthDTO> getSshKeys(String baseArtifactId);

    Mono<T> createNewArtifactForCheckout(Artifact sourceArtifact, String branchName);

    Mono<T> saveArtifact(Artifact artifact);

    Mono<T> updateArtifactWithSchemaVersions(Artifact artifact);

    Mono<Void> updateArtifactWithProtectedBranches(String baseArtifactId, List<String> branchNames);

    Flux<T> deleteAllBranches(String baseArtifactId, List<String> branches);

    Mono<T> deleteArtifactByResource(Artifact artifact);

    void resetAttributeInBaseArtifact(Artifact baseArtifact);

    Mono<T> disconnectEntitiesOfBaseArtifact(Artifact artifact);

    Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, String... args);

    Mono<Path> intialiseReadMe(Artifact artifact, Path readMePath, String originHeader) throws IOException;

    Mono<T> isPrivateRepoLimitReached(Artifact artifact, boolean isClearCache);

    Mono<T> publishArtifact(Artifact artifact, Boolean publishedManually);

    Mono<T> createArtifactForImport(String workspaceId, String repoName);

    Mono<T> deleteArtifact(String artifactId);

    Boolean isContextInArtifactEmpty(ArtifactExchangeJson artifactExchangeJson);
}
