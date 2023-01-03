package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserUtilsCE;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.solutions.PermissionGroupPermission;
import org.springframework.stereotype.Component;

@Component
public class UserUtils extends UserUtilsCE {
    public UserUtils(ConfigRepository configRepository,
                     PermissionGroupRepository permissionGroupRepository,
                     CacheableRepositoryHelper cacheableRepositoryHelper,
                     PermissionGroupPermission permissionGroupPermission) {

        super(configRepository, permissionGroupRepository, cacheableRepositoryHelper, permissionGroupPermission);
    }
}
