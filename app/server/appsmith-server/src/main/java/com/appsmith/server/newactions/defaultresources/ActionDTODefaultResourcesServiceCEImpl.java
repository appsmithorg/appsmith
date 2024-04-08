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
        String defaultCollectionId = domainObject.getCollectionId();

        if (existingDefaultResources != null && !resetExistingValues) {
            // Check if there are properties to be copied over from existing
            if (StringUtils.hasText(existingDefaultResources.getPageId())) {
                defaultPageId = existingDefaultResources.getPageId();
            }
            if (StringUtils.hasText(existingDefaultResources.getCollectionId())) {
                defaultCollectionId = existingDefaultResources.getCollectionId();
            }
        }

        defaultResources.setPageId(defaultPageId);
        defaultResources.setCollectionId(defaultCollectionId);

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }

    @Override
    public ActionDTO setFromOtherBranch(ActionDTO domainObject, ActionDTO defaultDomainObject, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        defaultResources.setPageId(defaultDomainObject.getDefaultResources().getPageId());
        defaultResources.setCollectionId(
                defaultDomainObject.getDefaultResources().getCollectionId());

        domainObject.setDefaultResources(defaultResources);
        return domainObject;
    }
}
