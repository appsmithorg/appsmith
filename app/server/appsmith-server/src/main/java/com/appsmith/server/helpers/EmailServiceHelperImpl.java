package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.EmailServiceHelperCEImpl;
import com.appsmith.server.services.OrganizationService;
import org.springframework.stereotype.Component;

@Component
public class EmailServiceHelperImpl extends EmailServiceHelperCEImpl implements EmailServiceHelper {
    public EmailServiceHelperImpl(OrganizationService organizationService) {
        super(organizationService);
    }
}
