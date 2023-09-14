package com.appsmith.server.helpers.ce_compatible;

import com.appsmith.server.helpers.ce.UserServiceHelperCEImpl;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.PolicySolution;
import org.springframework.stereotype.Component;

@Component
public class UserServiceHelperCECompatibleImpl extends UserServiceHelperCEImpl
        implements UserServiceHelperCECompatible {
    public UserServiceHelperCECompatibleImpl(
            PolicySolution policySolution, PermissionGroupService permissionGroupService) {
        super(policySolution, permissionGroupService);
    }
}
