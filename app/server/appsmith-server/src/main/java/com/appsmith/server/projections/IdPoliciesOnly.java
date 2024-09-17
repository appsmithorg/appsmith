package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;

import java.util.Map;

public interface IdPoliciesOnly {
    String getId();

    Map<String, Policy> getPolicyMap();
}
