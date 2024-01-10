package com.appsmith.server.newactions.defaultresources;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.defaultresources.DefaultResourcesServiceCE;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ActionDTODefaultResourcesServiceCEImpl implements DefaultResourcesServiceCE<ActionDTO> {

    @Override
    public ActionDTO initialize(ActionDTO domainObject, String branchName, boolean resetExistingValues) {
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
    public ActionDTO setFromOtherBranch(ActionDTO domainObject, ActionDTO defaultDomainObject, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        defaultResources.setPageId(defaultDomainObject.getDefaultResources().getPageId());

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
