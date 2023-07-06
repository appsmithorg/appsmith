package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.Policy;

import java.util.Optional;
import java.util.Set;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

public class PolicyUtil {

    public static boolean isPermissionPresentInPolicies(
            String permission, Set<Policy> policies, Set<String> userPermissionGroupIds) {

        Optional<Policy> interestingPolicyOptional = policies.stream()
                .filter(policy -> policy.getPermission().equals(permission))
                .findFirst();
        if (interestingPolicyOptional.isEmpty()) {
            return FALSE;
        }

        Policy interestingPolicy = interestingPolicyOptional.get();
        Set<String> permissionGroupsIds = interestingPolicy.getPermissionGroups();
        if (permissionGroupsIds == null || permissionGroupsIds.isEmpty()) {
            return FALSE;
        }

        return userPermissionGroupIds.stream()
                .filter(permissionGroupsIds::contains)
                .findFirst()
                .map(permissionGroup -> TRUE)
                .orElse(FALSE);
    }
}
