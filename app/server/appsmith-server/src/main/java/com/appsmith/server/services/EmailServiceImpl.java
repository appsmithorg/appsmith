package com.appsmith.server.services;

import com.appsmith.server.helpers.EmailServiceHelper;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.ce.EmailServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl extends EmailServiceCEImpl implements EmailService {
    public EmailServiceImpl(
            EmailSender emailSender, EmailServiceHelper emailServiceHelper, OrganizationService organizationService) {
        super(emailSender, emailServiceHelper, organizationService);
    }
}
