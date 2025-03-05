package com.appsmith.server.helpers;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class InMemoryCacheableRepositoryHelper {
    @Getter
    @Setter
    private static Set<String> anonymousUserPermissionGroupIds = null;

    @Getter
    @Setter
    private static String instanceAdminPermissionGroupId = null;

    private static final Map<String, String> inMemoryOrganizationIdOrganizationPermissionGroupIdMap = new HashMap<>();

    public static String getOrganizationAdminPermissionGroupId(String organizationId) {
        return inMemoryOrganizationIdOrganizationPermissionGroupIdMap.get(organizationId);
    }

    public static void setOrganizationAdminPermissionGroupId(String organizationId, String permissionGroupId) {
        inMemoryOrganizationIdOrganizationPermissionGroupIdMap.put(organizationId, permissionGroupId);
    }
}
