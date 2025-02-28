package com.appsmith.server.helpers;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

public class InMemoryCacheableRepositoryHelper {
    @Getter
    @Setter
    private static Set<String> anonymousUserPermissionGroupIds = null;

    @Getter
    @Setter
    private static String instanceAdminPermissionGroupId = null;
}
