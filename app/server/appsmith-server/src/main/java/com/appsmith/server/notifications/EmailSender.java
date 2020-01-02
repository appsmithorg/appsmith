package com.appsmith.server.notifications;

import com.appsmith.server.configurations.EmailConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailSender {

    @Autowired
    JavaMailSender emailSender;

    @Autowired
    EmailConfig emailConfig;

    private final String MAIL_FROM = "hello@appsmith.com";

    public void sendMail(String to, String subject, String text) throws MailException {
        // Don't send an email for local, dev or test environments
        if (!emailConfig.isEmailEnabled()) {
            return;
        }

        log.debug("Going to send email to {} with subject {}", to, subject);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(MAIL_FROM);
        message.setSubject(subject);
        message.setText(text);
        emailSender.send(message);
    }
}
