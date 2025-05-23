package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static java.lang.Boolean.TRUE;

@Component
public class ActionPermissionCEImpl implements ActionPermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_ACTIONS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_ACTIONS;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return isGitSync ? null : TRUE.equals(exportWithConfiguration) ? getReadPermission() : getEditPermission();
    }

    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_ACTIONS;
    }

    @Override
    public Mono<AclPermission> getDeletePermission() {
        return Mono.just(AclPermission.MANAGE_ACTIONS);
    }
}
