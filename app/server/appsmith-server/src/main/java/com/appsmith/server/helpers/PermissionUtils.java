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
        // Make sure the user context is not available in the permission object to avoid any static data leaks from the
        // earlier call.
        permission.get().setUser(null);
        return getCurrentUser()
                .map(user -> {
                    permission.get().setUser(user);
                    return permission;
                })
                .switchIfEmpty(Mono.just(permission));
    }

    public static Mono<AclPermission> updateAclWithUserContext(AclPermission permission) {
        if (permission == null) {
            return Mono.empty();
        }
        // Make sure the user context is not available in the permission object to avoid any static data leaks from the
        // earlier call.
        permission.setUser(null);
        return getCurrentUser()
                .map(user -> {
                    permission.setUser(user);
                    return permission;
                })
                .switchIfEmpty(Mono.just(permission));
    }
}
