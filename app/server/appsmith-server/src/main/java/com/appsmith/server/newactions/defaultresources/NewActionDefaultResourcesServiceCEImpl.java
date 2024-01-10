package com.appsmith.server.newactions.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesServiceCE;
import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class NewActionDefaultResourcesServiceCEImpl implements DefaultResourcesServiceCE<NewAction> {

    @Override
    public NewAction initialize(NewAction domainObject, String branchName, boolean resetExistingValues) {
        DefaultResources existingDefaultResources = domainObject.getDefaultResources();
        DefaultResources defaultResources = new DefaultResources();

        String defaultApplicationId = domainObject.getApplicationId();
        String defaultActionId = domainObject.getId();

        if (existingDefaultResources != null && !resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getApplicationId())) {
                defaultApplicationId = existingDefaultResources.getApplicationId();
            }

            if (StringUtils.hasText(existingDefaultResources.getActionId())) {
                defaultActionId = existingDefaultResources.getActionId();
            }
        }

        defaultResources.setActionId(defaultActionId);
        defaultResources.setApplicationId(defaultApplicationId);
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }

    @Override
    public NewAction setFromOtherBranch(NewAction domainObject, NewAction defaultDomainObject, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        DefaultResources otherDefaultResources = defaultDomainObject.getDefaultResources();

        defaultResources.setActionId(otherDefaultResources.getActionId());
        defaultResources.setApplicationId(otherDefaultResources.getApplicationId());
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
