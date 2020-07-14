package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class EncryptionConfig {

    @Value("${encrypt.salt}")
    private String salt;

    @Value("${encrypt.password}")
    private String password;
}
