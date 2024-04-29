package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;
import lombok.NonNull;

import java.util.HashSet;
import java.util.Set;

public record IdPoliciesOnly(@NonNull String id, Object policies) {
    public Set<Policy> getPolicies() {
        Set<Policy> policies = new HashSet<>();
        if (this.policies instanceof Set) {
            policies.addAll((Set<Policy>) this.policies);
        }
        return policies;
    }
}
