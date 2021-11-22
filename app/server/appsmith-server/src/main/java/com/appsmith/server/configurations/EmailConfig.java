package com.appsmith.server.configurations;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import javax.mail.internet.InternetAddress;
import java.io.UnsupportedEncodingException;

@Getter
@Setter
@Configuration
@Slf4j
public class EmailConfig {

    @Value("${mail.enabled}")
    private boolean emailEnabled = true;

    @Setter(AccessLevel.NONE)
    private InternetAddress mailFrom;

    private static final String DEFAULT_MAIL_FROM = "appsmith@localhost";

    @Value("${reply.to}")
    private String replyTo;

    @Value("${emails.welcome.enabled:true}")
    private boolean isWelcomeEmailEnabled;

    @Value("${mail.support}")
    private String supportEmailAddress;

    @Autowired
    public void setMailFrom(@Value("${mail.from}") String value) {
        if (!StringUtils.hasText(value)) {
            value = DEFAULT_MAIL_FROM;
        }

        try {
            mailFrom = new InternetAddress(value, "Appsmith");
        } catch (UnsupportedEncodingException e) {
            log.error("Encoding error creating Appsmith mail from address. Using default from address instead.", e);
            try {
                mailFrom = new InternetAddress(DEFAULT_MAIL_FROM, "Appsmith");
            } catch (UnsupportedEncodingException ignored) {
                // We shouldn't see this error here with the default address parsing.
                log.error("Encoding error with default from address. This should've never happened.", e);
            }
        }
    }

}
