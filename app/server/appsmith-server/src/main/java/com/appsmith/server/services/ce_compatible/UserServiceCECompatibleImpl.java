package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.EmailVerificationTokenRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce.UserServiceCEImpl;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.UserChangedHandler;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class UserServiceCECompatibleImpl extends UserServiceCEImpl implements UserServiceCECompatible {
    public UserServiceCECompatibleImpl(
            Scheduler scheduler,
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
            PolicySolution policySolution,
            CommonConfig commonConfig,
            EmailConfig emailConfig,
            UserChangedHandler userChangedHandler,
            EncryptionService encryptionService,
            UserDataService userDataService,
            TenantService tenantService,
            PermissionGroupService permissionGroupService,
            UserUtils userUtils,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            RedirectHelper redirectHelper,
            RateLimitService rateLimitService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                workspaceService,
                analyticsService,
                sessionUserService,
                passwordResetTokenRepository,
                passwordEncoder,
                emailSender,
                applicationRepository,
                policySolution,
                commonConfig,
                emailConfig,
                userChangedHandler,
                encryptionService,
                userDataService,
                tenantService,
                permissionGroupService,
                userUtils,
                emailVerificationTokenRepository,
                redirectHelper,
                rateLimitService);
    }

    @Override
    public Mono<ProvisionResourceDto> createProvisionUser(User user) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ProvisionResourceDto> updateProvisionUser(String userId, UserUpdateDTO userUpdateDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ProvisionResourceDto> getProvisionUser(String userId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PagedDomain<ProvisionResourceDto>> getProvisionUsers(MultiValueMap<String, String> queryParams) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
