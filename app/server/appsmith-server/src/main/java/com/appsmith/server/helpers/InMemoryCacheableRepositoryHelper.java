package com.appsmith.server.helpers;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class InMemoryCacheableRepositoryHelper {
    private Set<String> anonymousUserPermissionGroupIds = null;

    private String defaultOrganizationId = null;

    private String instanceAdminPermissionGroupId = null;

    public Set<String> getAnonymousUserPermissionGroupIds() {
        return anonymousUserPermissionGroupIds;
    }

    public void setAnonymousUserPermissionGroupIds(Set<String> anonymousUserPermissionGroupIds) {
        this.anonymousUserPermissionGroupIds = anonymousUserPermissionGroupIds;
    }

    public String getDefaultOrganizationId() {
        return defaultOrganizationId;
    }

    public void setDefaultOrganizationId(String defaultOrganizationId) {
        this.defaultOrganizationId = defaultOrganizationId;
    }

    public void setInstanceAdminPermissionGroupId(String instanceAdminPermissionGroupId) {
        this.instanceAdminPermissionGroupId = instanceAdminPermissionGroupId;
    }

    public String getInstanceAdminPermissionGroupId() {
        return instanceAdminPermissionGroupId;
    }
}
