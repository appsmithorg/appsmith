package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.UserServiceHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.cakes.EmailVerificationTokenRepositoryCake;
import com.appsmith.server.repositories.cakes.PasswordResetTokenRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.PACConfigurationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce.UserServiceCEImpl;
import jakarta.validation.Validator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceCECompatibleImpl extends UserServiceCEImpl implements UserServiceCECompatible {
    public UserServiceCECompatibleImpl(
            Validator validator,
            UserRepository repositoryDirect,
            UserRepositoryCake repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PasswordResetTokenRepositoryCake passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            CommonConfig commonConfig,
            UserDataService userDataService,
            TenantService tenantService,
            UserUtils userUtils,
            EmailVerificationTokenRepositoryCake emailVerificationTokenRepository,
            EmailService emailService,
            RateLimitService rateLimitService,
            PACConfigurationService pacConfigurationService,
            UserServiceHelper userServiceHelper) {
        super(
                validator,
                repositoryDirect,
                repository,
                workspaceService,
                analyticsService,
                sessionUserService,
                passwordResetTokenRepository,
                passwordEncoder,
                commonConfig,
                userDataService,
                tenantService,
                userUtils,
                emailVerificationTokenRepository,
                emailService,
                rateLimitService,
                pacConfigurationService,
                userServiceHelper);
    }
}
