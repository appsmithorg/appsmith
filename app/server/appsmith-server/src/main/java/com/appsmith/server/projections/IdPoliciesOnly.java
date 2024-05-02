package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;

import java.util.Set;

public interface IdPoliciesOnly {
    String getId();

    Set<Policy> getPolicies();
}
