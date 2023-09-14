package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce_compatible.UserServiceHelperCECompatibleImpl;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.PolicySolution;
import org.springframework.stereotype.Component;

@Component
public class UserServiceHelperImpl extends UserServiceHelperCECompatibleImpl implements UserServiceHelper {
    public UserServiceHelperImpl(PolicySolution policySolution, PermissionGroupService permissionGroupService) {
        super(policySolution, permissionGroupService);
    }
}
