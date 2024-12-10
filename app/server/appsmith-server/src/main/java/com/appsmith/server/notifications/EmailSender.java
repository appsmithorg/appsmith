package com.appsmith.server.notifications;

import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.MailSettings;
import com.appsmith.server.helpers.TemplateUtils;
import com.appsmith.server.services.TenantService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Map;
import java.util.Properties;

import static com.appsmith.server.helpers.ValidationUtils.validateEmail;

@Component
@Slf4j
@RequiredArgsConstructor
public class EmailSender {

    private final EmailConfig emailConfig;

    private final TenantService tenantService;

    public Mono<Boolean> sendMail(String to, String subject, String text, Map<String, ?> params) {
        final String content;
        try {
            content = params == null ? text : TemplateUtils.parseTemplate(text, params);
        } catch (IOException e) {
            throw Exceptions.propagate(e);
        }

        final Mono<MailSettings> mailSettingsMono;

        if (emailConfig.isEmailEnabled()) {
            mailSettingsMono = Mono.just(new MailSettings(
                    true,
                    "smtp",
                    System.getenv("APPSMITH_MAIL_HOST"),
                    Integer.parseInt(StringUtils.defaultIfEmpty(System.getenv("APPSMITH_MAIL_POST"), "25")),
                    "true".equals(System.getenv("APPSMITH_MAIL_SMTP_TLS_ENABLED")),
                    System.getenv("APPSMITH_MAIL_USERNAME"),
                    System.getenv("APPSMITH_MAIL_PASSWORD"),
                    emailConfig.getReplyTo()));

        } else {
            mailSettingsMono = tenantService.getDefaultTenant().map(t -> t.getTenantConfiguration()
                    .getMailSettings());
        }

        /*
         * Creating a publisher which sends email in a blocking fashion, subscribing on the bounded elastic
         * scheduler and then subscribing to it so that the publisher starts emitting immediately. We do not
         * wait for the blocking call of `sendMailSync` to finish. BoundedElastic scheduler would ensure that
         * when the number of tasks go beyond the number of available threads, the tasks would be deferred till
         * a thread becomes available without overloading the server.
         */
        mailSettingsMono
                .doOnNext(mailSettings -> sendMailSync(to, subject, content, mailSettings))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();

        // Creating a hot source which would be created, emitted, and returned immediately.
        return Mono.just(Boolean.TRUE);
    }

    /**
     * [Synchronous]This function sends an HTML email to the user from the default email address
     *
     * @param to           Single valid string email address to send to. Multiple addresses doesn't work.
     * @param subject      Subject string.
     * @param text         HTML Body of the message. This method assumes UTF-8.
     * @param mailSettings Mail settings to use for sending the email.
     */
    private void sendMailSync(String to, String subject, String text, MailSettings mailSettings) {
        log.debug("Got request to send email to: {} with subject: {}", to, subject);
        // Don't send an email for local, dev or test environments
        if (!emailConfig.isEmailEnabled()) {
            return;
        }

        // Check if the email address is valid. It's possible for certain OAuth2 providers to not return the email ID
        if (!validateEmail(to)) {
            log.error("The email ID: {} is not valid. Not sending an email", to);
            return;
        }

        final JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailSettings.host());
        sender.setPort(mailSettings.port());

        final Properties props = sender.getJavaMailProperties();
        props.setProperty("mail.transport.protocol", mailSettings.protocol());

        props.put("mail.smtp.starttls.enable", mailSettings.isStartTLSEnabled().toString());

        props.put("mail.smtp.timeout", 7000); // 7 seconds

        if (mailSettings.username() != null && mailSettings.password() != null) {
            props.put("mail.smtp.auth", "true");
            sender.setUsername(mailSettings.username());
            sender.setPassword(mailSettings.password());
        } else {
            props.put("mail.smtp.auth", "false");
        }

        log.debug("Going to send email to {} with subject {}", to, subject);
        MimeMessage mimeMessage = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        try {
            helper.setTo(to);
            if (emailConfig.getMailFrom() != null) {
                helper.setFrom(emailConfig.getMailFrom());
            }

            final InternetAddress replyTo = makeReplyTo();
            if (replyTo != null) {
                helper.setReplyTo(replyTo);
            }

            helper.setSubject(subject);
            helper.setText(text, true);
            sender.send(mimeMessage);

            log.debug("Email sent successfully to {} with subject {}", to, subject);
        } catch (MessagingException e) {
            log.error(
                    "Unable to create the mime message while sending an email to {} with subject: {}. Cause: ",
                    to,
                    subject,
                    e);
        } catch (MailException e) {
            log.error("Unable to send email. Cause: ", e);
        }
    }

    private InternetAddress makeReplyTo() {
        try {
            return new InternetAddress(this.emailConfig.getReplyTo(), "Appsmith");
        } catch (UnsupportedEncodingException e) {
            log.error("Encoding error creating Appsmith reply to address.", e);
            return null;
        }
    }
}
