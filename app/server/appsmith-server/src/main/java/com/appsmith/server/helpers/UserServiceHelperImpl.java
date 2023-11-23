package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserServiceHelperCEImpl;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.PolicySolution;
import org.springframework.stereotype.Component;

@Component
public class UserServiceHelperImpl extends UserServiceHelperCEImpl implements UserServiceHelper {
    public UserServiceHelperImpl(PolicySolution policySolution, PermissionGroupService permissionGroupService) {
        super(policySolution, permissionGroupService);
    }
}
