package com.appsmith.server.solutions;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.solutions.ce.PolicySolutionCE;
import reactor.core.publisher.Flux;

import java.util.Map;

public interface PolicySolution extends PolicySolutionCE {
    Flux<Environment> updateDefaultEnvironmentPoliciesByWorkspaceId(
            String workspaceId, Map<String, Policy> environmentPolicyMap, Boolean addViewAccess);
}
