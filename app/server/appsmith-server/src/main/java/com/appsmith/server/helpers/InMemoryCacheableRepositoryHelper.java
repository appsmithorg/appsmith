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

    private Map<String, String> inMemoryOrganizationIdOrganizationPermissionGroupIdMap = new HashMap<>();

    public String getOrganizationAdminPermissionGroupId(String organizationId) {
        return this.inMemoryOrganizationIdOrganizationPermissionGroupIdMap.get(organizationId);
    }

    public void setOrganizationAdminPermissionGroupId(String organizationId, String permissionGroupId) {
        this.inMemoryOrganizationIdOrganizationPermissionGroupIdMap.put(organizationId, permissionGroupId);
    }

}
