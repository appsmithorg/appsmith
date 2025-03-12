package com.appsmith.server.artifacts.permissions;

import com.appsmith.server.acl.AclPermission;
import reactor.core.publisher.Mono;

public interface ArtifactPermissionCE {

    AclPermission getEditPermission();

    Mono<AclPermission> getDeletePermission();

    AclPermission getGitConnectPermission();

    AclPermission getExportPermission();
}
