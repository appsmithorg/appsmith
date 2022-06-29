package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserServiceCEImpl;
import com.appsmith.server.solutions.UserChangedHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class UserServiceImpl extends UserServiceCEImpl implements UserService {

    public UserServiceImpl(Scheduler scheduler,
                           Validator validator,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           UserRepository repository,
                           WorkspaceService workspaceService,
                           AnalyticsService analyticsService,
                           SessionUserService sessionUserService,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           PasswordEncoder passwordEncoder,
                           EmailSender emailSender,
                           ApplicationRepository applicationRepository,
                           PolicyUtils policyUtils,
                           ConfigService configService,
                           CommonConfig commonConfig,
                           EmailConfig emailConfig,
                           UserChangedHandler userChangedHandler,
                           EncryptionService encryptionService,
                           ApplicationPageService applicationPageService,
                           UserDataService userDataService,
                           TenantService tenantService,
                           UserGroupService userGroupService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService,
                analyticsService, sessionUserService, passwordResetTokenRepository, passwordEncoder, emailSender,
                applicationRepository, policyUtils,
                configService, commonConfig, emailConfig, userChangedHandler, encryptionService, applicationPageService,
                userDataService, tenantService, userGroupService);
    }
}
