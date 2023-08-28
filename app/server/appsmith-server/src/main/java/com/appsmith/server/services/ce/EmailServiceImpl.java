package com.appsmith.server.services.ce;

import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl extends EmailServiceCEImpl implements EmailService {
    public EmailServiceImpl(EmailSender emailSender, TenantService tenantService) {
        super(emailSender, tenantService);
    }
}
