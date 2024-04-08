package com.appsmith.server.newpages.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesServiceCE;
import com.appsmith.server.domains.NewPage;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class NewPageDefaultResourcesServiceCEImpl implements DefaultResourcesServiceCE<NewPage> {

    @Override
    public NewPage initialize(NewPage domainObject, String branchName, boolean resetExistingValues) {
        DefaultResources existingDefaultResources = domainObject.getDefaultResources();
        DefaultResources defaultResources = new DefaultResources();

        String defaultApplicationId = domainObject.getApplicationId();
        String defaultPageId = domainObject.getId();

        if (existingDefaultResources != null && !resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getApplicationId())) {
                defaultApplicationId = existingDefaultResources.getApplicationId();
            }

            if (StringUtils.hasText(existingDefaultResources.getPageId())) {
                defaultPageId = existingDefaultResources.getPageId();
            }
        }

        defaultResources.setPageId(defaultPageId);
        defaultResources.setApplicationId(defaultApplicationId);
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }

    @Override
    public NewPage setFromOtherBranch(NewPage domainObject, NewPage defaultDomainObject, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        defaultResources.setPageId(defaultDomainObject.getId());
        defaultResources.setApplicationId(defaultDomainObject.getApplicationId());
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
