package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static java.lang.Boolean.TRUE;

@Component
public class PagePermissionCEImpl implements PagePermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_PAGES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_PAGES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return isGitSync ? null : TRUE.equals(exportWithConfiguration) ? getReadPermission() : getEditPermission();
    }

    @Override
    public Mono<AclPermission> getDeletePermission() {
        return Mono.just(AclPermission.MANAGE_PAGES);
    }

    @Override
    public Mono<AclPermission> getActionCreatePermission() {
        return Mono.just(AclPermission.MANAGE_PAGES);
    }
}
