package com.appsmith.server.acl;

import lombok.Getter;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;

@Getter
public enum AppsmithRole {
    APPLICATION_ADMIN(Set.of(MANAGE_APPLICATIONS)),
    APPLICATION_VIEWER(Set.of(READ_APPLICATIONS)),
    ORGANIZATION_ADMIN(Set.of(MANAGE_ORGANIZATIONS)),
    ORGANIZATION_VIEWER(Set.of(READ_ORGANIZATIONS));

    private Set<AclPermission> permissions;

    AppsmithRole(Set<AclPermission> permissions) {
        this.permissions = permissions;
    }
}
