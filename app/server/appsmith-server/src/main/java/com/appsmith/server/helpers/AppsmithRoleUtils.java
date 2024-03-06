package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AppsmithRoleUtils {
    public static Map<String, List<AclPermission>> getPermissionListMapForRole(
            Collection<Class<? extends BaseDomain>> classes, AppsmithRole role) {
        Map<String, List<AclPermission>> map = new HashMap<>();

        for (Class<? extends BaseDomain> clazz : classes) {
            List<AclPermission> permissionList = role.getPermissions().stream()
                    .filter(aclPermission -> aclPermission.getEntity().equals(clazz))
                    .toList();
            map.put(clazz.getSimpleName(), permissionList);
        }
        return map;
    }
}
