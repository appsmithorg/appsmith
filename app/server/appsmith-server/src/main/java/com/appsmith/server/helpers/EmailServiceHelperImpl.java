package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.EmailServiceHelperCEImpl;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Component;

@Component
public class EmailServiceHelperImpl extends EmailServiceHelperCEImpl implements EmailServiceHelper {
    public EmailServiceHelperImpl(TenantService tenantService) {
        super(tenantService);
    }
}
