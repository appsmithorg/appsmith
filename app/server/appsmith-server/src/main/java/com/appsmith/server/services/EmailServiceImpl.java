package com.appsmith.server.services;

import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.ce.EmailServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl extends EmailServiceCEImpl implements EmailService {
    public EmailServiceImpl(EmailSender emailSender, TenantService tenantService) {
        super(emailSender, tenantService);
    }
}
