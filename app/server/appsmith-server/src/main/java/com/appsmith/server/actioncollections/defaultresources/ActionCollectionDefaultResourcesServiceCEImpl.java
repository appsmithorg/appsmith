package com.appsmith.server.actioncollections.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesServiceCE;
import com.appsmith.server.domains.ActionCollection;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ActionCollectionDefaultResourcesServiceCEImpl implements DefaultResourcesServiceCE<ActionCollection> {

    @Override
    public ActionCollection initialize(ActionCollection domainObject, String branchName, boolean resetExistingValues) {
        DefaultResources existingDefaultResources = domainObject.getDefaultResources();
        DefaultResources defaultResources = new DefaultResources();

        String defaultApplicationId = domainObject.getApplicationId();
        String defaultCollectionId = domainObject.getId();

        if (existingDefaultResources != null && !resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getApplicationId())) {
                defaultApplicationId = existingDefaultResources.getApplicationId();
            }

            if (StringUtils.hasText(existingDefaultResources.getCollectionId())) {
                defaultCollectionId = existingDefaultResources.getCollectionId();
            }
        }

        defaultResources.setCollectionId(defaultCollectionId);
        defaultResources.setApplicationId(defaultApplicationId);
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }

    @Override
    public ActionCollection setFromOtherBranch(
            ActionCollection domainObject, ActionCollection branchedDomainObject, String branchName) {
        DefaultResources defaultResources = domainObject.getDefaultResources();
        if (defaultResources == null) {
            defaultResources = new DefaultResources();
        }

        DefaultResources otherDefaultResources = branchedDomainObject.getDefaultResources();

        defaultResources.setCollectionId(otherDefaultResources.getCollectionId());
        defaultResources.setApplicationId(otherDefaultResources.getApplicationId());
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
