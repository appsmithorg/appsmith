package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserServiceHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.EmailVerificationTokenRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PACConfigurationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce.UserServiceCEImpl;
import jakarta.validation.Validator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

@Service
public class UserServiceCECompatibleImpl extends UserServiceCEImpl implements UserServiceCECompatible {
    public UserServiceCECompatibleImpl(
            Validator validator,
            UserRepository repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            CommonConfig commonConfig,
            UserDataService userDataService,
            OrganizationService organizationService,
            UserUtils userUtils,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            EmailService emailService,
            RateLimitService rateLimitService,
            PACConfigurationService pacConfigurationService,
            UserServiceHelper userServiceHelper,
            InstanceVariablesHelper instanceVariablesHelper) {
        super(
                validator,
                repository,
                workspaceService,
                analyticsService,
                sessionUserService,
                passwordResetTokenRepository,
                passwordEncoder,
                commonConfig,
                userDataService,
                organizationService,
                userUtils,
                emailVerificationTokenRepository,
                emailService,
                rateLimitService,
                pacConfigurationService,
                userServiceHelper,
                instanceVariablesHelper);
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
