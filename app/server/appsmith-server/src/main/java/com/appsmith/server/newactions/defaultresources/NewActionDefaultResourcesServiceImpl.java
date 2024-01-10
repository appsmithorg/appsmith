package com.appsmith.server.newactions.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class NewActionDefaultResourcesServiceImpl extends NewActionDefaultResourcesServiceCEImpl
        implements DefaultResourcesService<NewAction> {

    @Override
    public NewAction initialize(NewAction domainObject, String branchName, boolean resetExistingValues) {
        NewAction updatedDomainObject = super.initialize(domainObject, branchName, resetExistingValues);

        DefaultResources existingDefaultResources = updatedDomainObject.getDefaultResources();

        String defaultModuleInstanceId = domainObject.getModuleInstanceId();
        String defaultRootModuleInstanceId = domainObject.getRootModuleInstanceId();

        if (!resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getModuleInstanceId())) {
                defaultModuleInstanceId = existingDefaultResources.getModuleInstanceId();
            }

            if (StringUtils.hasText(existingDefaultResources.getRootModuleInstanceId())) {
                defaultRootModuleInstanceId = existingDefaultResources.getRootModuleInstanceId();
            }
        }

        existingDefaultResources.setModuleInstanceId(defaultModuleInstanceId);
        existingDefaultResources.setRootModuleInstanceId(defaultRootModuleInstanceId);

        return updatedDomainObject;
    }

    @Override
    public NewAction setFromOtherBranch(NewAction domainObject, NewAction branchedDomainObject, String branchName) {
        NewAction updatedNewAction = super.setFromOtherBranch(domainObject, branchedDomainObject, branchName);

        DefaultResources defaultResources = updatedNewAction.getDefaultResources();
        DefaultResources otherDefaultResources = branchedDomainObject.getDefaultResources();

        defaultResources.setModuleInstanceId(otherDefaultResources.getModuleInstanceId());
        defaultResources.setRootModuleInstanceId(otherDefaultResources.getRootModuleInstanceId());

        return updatedNewAction;
    }
}
