package com.appsmith.server.newpages.projections;

import com.appsmith.external.models.Policy;
import com.appsmith.server.projections.BranchAwareView;
import lombok.Getter;

import java.util.Map;

@Getter
public class PageViewWithoutDSL extends BranchAwareView {
    String applicationId;
    PageDTOView unpublishedPage;
    PageDTOView publishedPage;

    public PageViewWithoutDSL(
            String applicationId,
            PageDTOView unpublishedPage,
            PageDTOView publishedPage,
            String baseId,
            String branchName,
            String id,
            Map<String, Policy> policyMap) {
        super(baseId, branchName, id, policyMap);
        this.applicationId = applicationId;
        this.unpublishedPage = unpublishedPage;
        this.publishedPage = publishedPage;
    }
}
