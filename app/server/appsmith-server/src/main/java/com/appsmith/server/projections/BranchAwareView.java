package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;

import java.util.Map;

public class BranchAwareView extends BaseView {
    String baseId;
    String branchName;

    public BranchAwareView(String baseId, String branchName, String id, Map<String, Policy> policyMap) {
        super(id, policyMap);
        this.baseId = baseId;
        this.branchName = branchName;
    }

    public String getBaseIdOrFallback() {
        return baseId == null ? this.getId() : baseId;
    }
}
