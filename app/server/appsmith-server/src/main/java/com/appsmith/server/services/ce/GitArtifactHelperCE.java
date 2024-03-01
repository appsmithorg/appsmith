package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Artifact;
import reactor.core.publisher.Mono;

import java.nio.file.Path;

public interface GitArtifactHelperCE<T extends Artifact> {

    AclPermission getArtifactEditPermission();

    Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName);

    Mono<T> getArtifactById(String artifactId, AclPermission aclPermission);

    Mono<T> getArtifactByDefaultIdAndBranchName(
            String defaultArtifactId, String branchName, AclPermission aclPermission);
}
