package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.UserProfileDTO;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class UserServiceImpl extends UserServiceCEImpl implements UserService {

    private final UserDataService userDataService;

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
                           WorkspaceRepository organizationRepository,
                           UserWorkspaceService userOrganizationService,
                           RoleGraph roleGraph,
                           ConfigService configService,
                           CommonConfig commonConfig,
                           EmailConfig emailConfig,
                           UserChangedHandler userChangedHandler,
                           EncryptionService encryptionService,
                           ApplicationPageService applicationPageService,
                           UserDataService userDataService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService,
                analyticsService, sessionUserService, passwordResetTokenRepository, passwordEncoder, emailSender,
                applicationRepository, policyUtils, organizationRepository, userOrganizationService, roleGraph,
                configService, commonConfig, emailConfig, userChangedHandler, encryptionService, applicationPageService,
                userDataService);

        this.userDataService = userDataService;
    }

    @Override
    public Mono<UserProfileDTO> buildUserProfileDTO(User user) {
        return Mono.zip(
                        super.buildUserProfileDTO(user),
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData()),
                        ReactiveSecurityContextHolder.getContext()
                )
                // Add EE specific metadata to the user profile.
                .map(tuple -> {
                    final UserProfileDTO profile = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    SecurityContext context = tuple.getT3();

                    // Check here if the user is logged in via OIDC.
                    Authentication authentication = context.getAuthentication();
                    if (authentication instanceof OAuth2AuthenticationToken) {
                        // Add the ID claims here as metadata which can be exposed by the client to appsmith developers
                        profile.setIdToken(userData.getUserClaims());
                    } else {
                        // Do not return the field metadata otherwise.
                        profile.setIdToken(null);
                    }

                    return profile;
                });
    }
}
