package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserUtilsCE;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.cakes.ConfigRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.solutions.PermissionGroupPermission;
import org.springframework.stereotype.Component;

@Component
public class UserUtils extends UserUtilsCE {
    public UserUtils(
            ConfigRepositoryCake configRepository,
            PermissionGroupRepositoryCake permissionGroupRepository,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            PermissionGroupPermission permissionGroupPermission) {

        super(configRepository, permissionGroupRepository, cacheableRepositoryHelper, permissionGroupPermission);
    }
}
