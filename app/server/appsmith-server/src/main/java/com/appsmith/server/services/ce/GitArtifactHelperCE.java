package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Artifact;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface GitArtifactHelperCE<T extends Artifact> {

    AclPermission getArtifactEditPermission();

    AclPermission getArtifactGitConnectPermission();

    Mono<T> getArtifactById(String artifactId, AclPermission aclPermission);

    Mono<T> getArtifactByDefaultIdAndBranchName(
            String defaultArtifactId, String branchName, AclPermission aclPermission);

    Mono<T> saveArtifact(Artifact artifact);

    Mono<T> updateArtifactWithSchemaVersions(Artifact artifact);

    T updateArtifactWithDefaultReponseUtils(Artifact artifact);

    Flux<T> deleteAllBranches(String defaultArtifactId, List<String> branches);

    void resetAttributeInDefaultArtifact(Artifact defaultArtifact);

    Mono<T> disconnectEntitiesOfDefaultArtifact(Artifact artifact);

    Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, String... args);

    Mono<Path> intialiseReadMe(Artifact artifact, Path readMePath, String originHeader) throws IOException;

    Mono<T> isPrivateRepoLimitReached(Artifact artifact, boolean isClearCache);

    Mono<T> publishArtifact(Artifact artifact);
}
