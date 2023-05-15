package com.appsmith.server.services;

import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.ce.EmailServiceCEImpl;
import lombok.AllArgsConstructor;

public class EmailServiceImpl extends EmailServiceCEImpl implements EmailService {

    public EmailServiceImpl(EmailSender emailSender) {
        super(emailSender);
    }
}
