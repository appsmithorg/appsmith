package com.appsmith.server.helpers;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Getter
@Setter
public class InMemoryCacheableRepositoryHelper {
    private Set<String> anonymousUserPermissionGroupIds = null;

    private String defaultTenantId = null;

    private String instanceAdminPermissionGroupId = null;
}
