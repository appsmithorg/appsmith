package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class WorkspacePermissionCEImpl implements WorkspacePermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_WORKSPACES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return null;
    }

    @Override
    public Mono<AclPermission> getDeletePermission() {
        return Mono.just(AclPermission.MANAGE_WORKSPACES);
    }

    @Override
    public Mono<AclPermission> getApplicationCreatePermission() {
        return Mono.just(AclPermission.WORKSPACE_MANAGE_APPLICATIONS);
    }

    @Override
    public Mono<AclPermission> getDatasourceCreatePermission() {
        return Mono.just(AclPermission.WORKSPACE_MANAGE_DATASOURCES);
    }
}
