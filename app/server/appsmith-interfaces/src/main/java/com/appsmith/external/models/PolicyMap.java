package com.appsmith.external.models;

import lombok.EqualsAndHashCode;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

@EqualsAndHashCode(callSuper = true)
public class PolicyMap extends HashMap<String, Set<String>> {
    // Map permission strings to set of permission group IDs.

    public Set<Policy> toPolicySet() {
        final Set<Policy> policies = new HashSet<>();

        for (Entry<String, Set<String>> entry : entrySet()) {
            policies.add(new Policy(entry.getKey(), entry.getValue()));
        }

        return policies;
    }

    public static PolicyMap fromPolicies(Set<Policy> policies) {
        final PolicyMap policyMap = new PolicyMap();

        if (policies != null) {
            for (Policy policy : policies) {
                policyMap.put(policy.getPermission(), policy.getPermissionGroups());
            }
        }

        return policyMap;
    }
}
