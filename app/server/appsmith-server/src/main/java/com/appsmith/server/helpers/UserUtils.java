package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserUtilsCE;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import org.springframework.stereotype.Component;

@Component
public class UserUtils extends UserUtilsCE {
    public UserUtils(ConfigRepository configRepository,
                     PermissionGroupRepository permissionGroupRepository,
                     CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(configRepository, permissionGroupRepository, cacheableRepositoryHelper);
    }
}
