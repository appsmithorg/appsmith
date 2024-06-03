package com.appsmith.server.helpers;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.dtos.Permission;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ReactiveContextUtils.getCurrentUser;

public class PermissionUtils {

    public static Set<Permission> collateAllPermissions(Set<Permission>... permissionArgs) {
        Set<Permission> permissions = new HashSet<>();
        Arrays.stream(permissionArgs).peek(permissions::addAll).toList();
        return permissions;
    }

    public static Mono<Optional<AclPermission>> updateAclWithUserContext(Optional<AclPermission> permission) {
        if (permission.isEmpty()) {
            return Mono.just(permission);
        }
        return getCurrentUser()
                .map(user -> {
                    permission.ifPresent(aclPermission -> aclPermission.setUser(user));
                    return permission;
                })
                .switchIfEmpty(Mono.just(permission));
    }

    public static Mono<AclPermission> updateAclWithUserContext(AclPermission permission) {
        if (permission == null) {
            return Mono.empty();
        }
        return getCurrentUser()
                .map(user -> {
                    permission.setUser(user);
                    return permission;
                })
                .switchIfEmpty(Mono.just(permission));
    }
}
