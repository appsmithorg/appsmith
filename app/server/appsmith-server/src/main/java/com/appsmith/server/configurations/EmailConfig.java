package com.appsmith.server.configurations;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
public class EmailConfig {

    @Value("${mail.enabled}")
    private boolean emailEnabled = true;

    @Value("${mail.from}")
    private String mailFrom;

    @Value("${reply.to}")
    private String replyTo;
}
