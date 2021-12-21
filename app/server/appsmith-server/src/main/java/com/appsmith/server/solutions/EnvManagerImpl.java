package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.EnvManagerCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EnvManagerImpl extends EnvManagerCEImpl implements EnvManager {

    public EnvManagerImpl(SessionUserService sessionUserService,
                          UserService userService,
                          PolicyUtils policyUtils,
                          EmailSender emailSender,
                          CommonConfig commonConfig,
                          EmailConfig emailConfig,
                          JavaMailSender javaMailSender,
                          GoogleRecaptchaConfig googleRecaptchaConfig,
                          FileUtils fileUtils) {

        super(sessionUserService, userService, policyUtils, emailSender, commonConfig, emailConfig, javaMailSender,
                googleRecaptchaConfig, fileUtils);
    }
}
