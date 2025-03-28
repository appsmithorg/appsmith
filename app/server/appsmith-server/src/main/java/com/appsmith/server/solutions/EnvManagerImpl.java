package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.helpers.BlacklistedEnvVariableHelper;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.EnvManagerCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EnvManagerImpl extends EnvManagerCEImpl implements EnvManager {

    public EnvManagerImpl(
            SessionUserService sessionUserService,
            UserService userService,
            AnalyticsService analyticsService,
            UserRepository userRepository,
            EmailSender emailSender,
            CommonConfig commonConfig,
            EmailConfig emailConfig,
            JavaMailSender javaMailSender,
            GoogleRecaptchaConfig googleRecaptchaConfig,
            FileUtils fileUtils,
            PermissionGroupService permissionGroupService,
            ConfigService configService,
            UserUtils userUtils,
            OrganizationService organizationService,
            ObjectMapper objectMapper,
            EmailService emailService,
            BlacklistedEnvVariableHelper blacklistedEnvVariableHelper) {

        super(
                sessionUserService,
                userService,
                analyticsService,
                userRepository,
                emailSender,
                commonConfig,
                emailConfig,
                javaMailSender,
                googleRecaptchaConfig,
                fileUtils,
                permissionGroupService,
                configService,
                userUtils,
                organizationService,
                objectMapper,
                emailService,
                blacklistedEnvVariableHelper);
    }
}
