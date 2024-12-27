package com.appsmith.server.artifacts.base.artifactbased;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.domains.Artifact;
import reactor.core.publisher.Mono;

public interface ArtifactBasedServiceCE<T extends Artifact> {

    Mono<T> findById(String id, AclPermission aclPermission);

    Mono<T> save(Artifact artifact);

    ArtifactPermission getPermissionService();
}
