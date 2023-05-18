package com.appsmith.server.helpers;

import com.appsmith.server.dtos.Permission;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class PermissionUtils {

    public static Set<Permission> collateAllPermissions(Set<Permission>... permissionArgs) {
        Set<Permission> permissions = new HashSet<>();
        Arrays.stream(permissionArgs).peek(permissions::addAll).toList();
        return permissions;
    }
}
