package com.appsmith.server.moduleinstances.defaultresources;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ModuleInstanceDTODefaultResourcesServiceImpl implements DefaultResourcesService<ModuleInstanceDTO> {

    @Override
    public ModuleInstanceDTO initialize(
            ModuleInstanceDTO domainObject, String branchName, boolean resetExistingValues) {
        DefaultResources existingDefaultResources = domainObject.getDefaultResources();
        DefaultResources defaultResources = new DefaultResources();

        String defaultPageId = domainObject.getPageId();

        if (existingDefaultResources != null && !resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getPageId())) {
                defaultPageId = existingDefaultResources.getPageId();
            }
        }

        defaultResources.setPageId(defaultPageId);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }

    @Override
    public ModuleInstanceDTO setFromOtherBranch(
            ModuleInstanceDTO domainObject, ModuleInstanceDTO defaultDomainObject, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        defaultResources.setPageId(defaultDomainObject.getDefaultResources().getPageId());

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
