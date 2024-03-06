package com.appsmith.server.moduleinstances.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ModuleInstance;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ModuleInstanceDefaultResourcesServiceImpl implements DefaultResourcesService<ModuleInstance> {

    @Override
    public ModuleInstance initialize(ModuleInstance domainObject, String branchName, boolean resetExistingValues) {
        DefaultResources existingDefaultResources = domainObject.getDefaultResources();
        DefaultResources defaultResources = new DefaultResources();

        String defaultApplicationId = domainObject.getApplicationId();
        String defaultModuleInstanceId = domainObject.getId();

        if (existingDefaultResources != null && !resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getApplicationId())) {
                defaultApplicationId = existingDefaultResources.getApplicationId();
            }

            if (StringUtils.hasText(existingDefaultResources.getModuleInstanceId())) {
                defaultModuleInstanceId = existingDefaultResources.getModuleInstanceId();
            }
        }

        defaultResources.setModuleInstanceId(defaultModuleInstanceId);
        defaultResources.setApplicationId(defaultApplicationId);
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }

    @Override
    public ModuleInstance setFromOtherBranch(
            ModuleInstance domainObject, ModuleInstance defaultDomainObject, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        DefaultResources otherDefaultResources = defaultDomainObject.getDefaultResources();
        defaultResources.setModuleInstanceId(otherDefaultResources.getModuleInstanceId());
        defaultResources.setApplicationId(otherDefaultResources.getApplicationId());
        defaultResources.setBranchName(branchName);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
