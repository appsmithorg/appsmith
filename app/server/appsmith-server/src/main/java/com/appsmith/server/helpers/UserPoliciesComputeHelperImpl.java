package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserPoliciesComputeHelperCEImpl;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.PolicySolution;
import org.springframework.stereotype.Component;

@Component
public class UserPoliciesComputeHelperImpl extends UserPoliciesComputeHelperCEImpl
        implements UserPoliciesComputeHelper {
    public UserPoliciesComputeHelperImpl(PolicySolution policySolution, PermissionGroupService permissionGroupService) {
        super(policySolution, permissionGroupService);
    }
}
