package com.appsmith.server.helpers;

import lombok.Getter;
import lombok.Setter;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Configuration
@Getter
@Setter
public class InMemoryCacheableRepositoryHelper {

    private Set<String> anonymousUserPermissionGroupIds = null;

    private String defaultOrganizationId = null;

    private String instanceAdminPermissionGroupId = null;

    private final Map<String, String> inMemoryOrganizationIdOrganizationPermissionGroupIdMap = new HashMap<>();

    public String getOrganizationAdminPermissionGroupId(String organizationId) {
        return this.inMemoryOrganizationIdOrganizationPermissionGroupIdMap.get(organizationId);
    }

    public void setOrganizationAdminPermissionGroupId(String organizationId, String permissionGroupId) {
        this.inMemoryOrganizationIdOrganizationPermissionGroupIdMap.put(organizationId, permissionGroupId);
    }
}
