package com.appsmith.server.notifications;

import com.appsmith.server.configurations.EmailConfig;
import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import javax.mail.MessagingException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.io.IOException;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class EmailSender {

    final JavaMailSender javaMailSender;

    final EmailConfig emailConfig;

    private static final InternetAddress MAIL_FROM = makeFromAddress();

    public static final Pattern VALID_EMAIL_ADDRESS_REGEX =
            Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);

    public EmailSender(JavaMailSender javaMailSender, EmailConfig emailConfig) {
        this.javaMailSender = javaMailSender;
        this.emailConfig = emailConfig;
    }

    private static boolean validateEmail(String emailStr) {
        Matcher matcher = VALID_EMAIL_ADDRESS_REGEX.matcher(emailStr);
        return matcher.find();
    }

    public Mono<Void> sendMail(String to, String subject, String text, Map<String, String> params) {
        return Mono
                .fromSupplier(() -> {
                    try {
                        return replaceEmailTemplate(text, params);
                    } catch (IOException e) {
                        throw Exceptions.propagate(e);
                    }
                })
                .flatMap(emailBody -> sendMail(to, subject, emailBody));
    }

    public Mono<Void> sendMail(String to, String subject, String text) {
        return Mono.fromRunnable(() -> sendMailSync(to, subject, text));
    }

    /**
     * This function sends an HTML email to the user from the default email address
     *
     * @param to      Single valid string email address to send to. Multiple addresses doesn't work.
     * @param subject Subject string.
     * @param text    HTML Body of the message. This method assumes UTF-8.
     */
    private void sendMailSync(String to, String subject, String text) {
        log.debug("Got request to send email to: {} with subject: {}", to, subject);
        // Don't send an email for local, dev or test environments
        if (!emailConfig.isEmailEnabled()) {
            return;
        }

        if (MAIL_FROM == null) {
            log.error("MAIL_FROM is null, no From address object to send an email. Not sending email '{}'.", subject);
            return;
        }

        // Check if the email address is valid. It's possible for certain OAuth2 providers to not return the email ID
        if (to == null || !validateEmail(to)) {
            log.error("The email ID: {} is not valid. Not sending an email", to);
            return;
        }

        log.debug("Going to send email to {} with subject {}", to, subject);
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        try {
            helper.setTo(to);
            helper.setFrom(MAIL_FROM);
            helper.setSubject(subject);
            helper.setText(text, true);
            javaMailSender.send(mimeMessage);
        } catch (MessagingException e) {
            log.error("Unable to create the mime message while sending an email to {} with subject: {}. Cause: ", to, subject, e);
        } catch (MailException e) {
            log.error("Unable to send email. Cause: ", e);
        }
    }

    /**
     * This function replaces the variables in an email template to actual values. It uses the Mustache SDK.
     *
     * @param template The name of the template where the HTML text can be found
     * @param params   A Map of key-value pairs with the key being the variable in the template & value being the actual
     *                 value with which it must be replaced.
     * @return Template string with Mustache replacements applied.
     * @throws IOException bubbled from Mustache renderer.
     */
    private String replaceEmailTemplate(String template, Map<String, String> params) throws IOException {
        MustacheFactory mf = new DefaultMustacheFactory();
        StringWriter stringWriter = new StringWriter();
        Mustache mustache = mf.compile(template);
        mustache.execute(stringWriter, params).flush();
        return stringWriter.toString();
    }

    private static InternetAddress makeFromAddress() {
        try {
            return new InternetAddress("hello@appsmith.com", "Appsmith");
        } catch (UnsupportedEncodingException e) {
            log.error("Encoding error creating Appsmith from address.", e);
            return null;
        }
    }
}
