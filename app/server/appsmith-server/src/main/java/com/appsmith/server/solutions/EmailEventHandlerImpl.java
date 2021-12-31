package com.appsmith.server.solutions;

import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.solutions.ce.EmailEventHandlerCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailEventHandlerImpl extends EmailEventHandlerCEImpl implements EmailEventHandler {

    public EmailEventHandlerImpl(ApplicationEventPublisher applicationEventPublisher,
                                 EmailSender emailSender,
                                 OrganizationRepository organizationRepository,
                                 ApplicationRepository applicationRepository,
                                 NewPageRepository newPageRepository,
                                 PolicyUtils policyUtils,
                                 EmailConfig emailConfig) {

        super(applicationEventPublisher, emailSender, organizationRepository, applicationRepository, newPageRepository,
                policyUtils, emailConfig);
    }
}
