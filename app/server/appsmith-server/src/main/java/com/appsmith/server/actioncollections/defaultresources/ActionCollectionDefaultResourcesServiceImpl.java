package com.appsmith.server.actioncollections.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ActionCollectionDefaultResourcesServiceImpl extends ActionCollectionDefaultResourcesServiceCEImpl
        implements DefaultResourcesService<ActionCollection> {

    @Override
    public ActionCollection initialize(ActionCollection domainObject, String branchName, boolean resetExistingValues) {
        ActionCollection updatedDomainObject = super.initialize(domainObject, branchName, resetExistingValues);

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
    public ActionCollection setFromOtherBranch(
            ActionCollection domainObject, ActionCollection branchedDomainObject, String branchName) {
        ActionCollection updatedActionCollection =
                super.setFromOtherBranch(domainObject, branchedDomainObject, branchName);

        DefaultResources defaultResources = updatedActionCollection.getDefaultResources();
        DefaultResources otherDefaultResources = branchedDomainObject.getDefaultResources();

        defaultResources.setModuleInstanceId(otherDefaultResources.getModuleInstanceId());
        defaultResources.setRootModuleInstanceId(otherDefaultResources.getRootModuleInstanceId());

        return updatedActionCollection;
    }
}
