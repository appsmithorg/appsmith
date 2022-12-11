package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserServiceCEImpl;
import com.appsmith.server.solutions.UserChangedHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

@Slf4j
@Service
public class UserServiceImpl extends UserServiceCEImpl implements UserService {
    private final UserDataService userDataService;
    private final TenantService tenantService;
    private final CommonConfig commonConfig;
    public static final String DEFAULT_APPSMITH_LOGO = "https://assets.appsmith.com/appsmith-logo.svg";
    private static final String DEFAULT_PRIMARY_COLOR = "#F86A2B";
    private static final String DEFAULT_BACKGROUND_COLOR = "#FFFFFF";
    private static final String DEFAULT_FONT_COLOR = "#000000";

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
                           CommonConfig commonConfig,
                           EmailConfig emailConfig,
                           UserChangedHandler userChangedHandler,
                           EncryptionService encryptionService,
                           UserDataService userDataService,
                           TenantService tenantService,
                           PermissionGroupService permissionGroupService,
                           UserUtils userUtils) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService, analyticsService,
                sessionUserService, passwordResetTokenRepository, passwordEncoder, emailSender, applicationRepository,
                policyUtils, commonConfig, emailConfig, userChangedHandler, encryptionService, userDataService, tenantService,
                permissionGroupService, userUtils);

        this.userDataService = userDataService;
        this.tenantService = tenantService;
        this.commonConfig = commonConfig;
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

    @Override
    public Flux<User> findAllByIdsIn(Set<String> ids) {
        return repository.findAllById(ids);
    }

    @Override
    public Flux<User> findAllByUsernameIn(Set<String> usernames) {
        return repository.findAllByEmails(usernames);
    }

    @Override
    public Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params) {
        final Mono<String> originMono = Mono.deferContextual(contextView -> {
                    if (contextView.hasKey(ServerWebExchange.class)) {
                        return Mono.justOrEmpty(
                                contextView.get(ServerWebExchange.class).getRequest().getHeaders().getFirst("Origin")
                        );
                    }
                    return Mono.empty();
                })
                .defaultIfEmpty("");

        return Mono.zip(originMono, tenantService.getDefaultTenant())
                .map(tuple -> {
                    final String origin = tuple.getT1();
                    final TenantConfiguration tenantConfiguration = tuple.getT2().getTenantConfiguration();
                    String logoUrl = null;
                    String primaryColor = null;
                    String backgroundColor = null;
                    String fontColor = null;

                    if (StringUtils.isNotEmpty(origin) && tenantConfiguration.isWhitelabelEnabled()) {
                        logoUrl = origin + tenantConfiguration.getBrandLogoUrl();
                        primaryColor = tenantConfiguration.getBrandColors().getPrimary();
                        backgroundColor = tenantConfiguration.getBrandColors().getBackground();
                        fontColor = tenantConfiguration.getBrandColors().getFont();
                    }

                    params.put("instanceName", StringUtils.defaultIfEmpty(commonConfig.getInstanceName(), "Appsmith"));
                    params.put("logoUrl", StringUtils.defaultIfEmpty(logoUrl, DEFAULT_APPSMITH_LOGO));
                    params.put("brandPrimaryColor", StringUtils.defaultIfEmpty(primaryColor, DEFAULT_PRIMARY_COLOR));
                    params.put("brandBackgroundColor", StringUtils.defaultIfEmpty(backgroundColor, DEFAULT_BACKGROUND_COLOR));
                    params.put("brandFontColor", StringUtils.defaultIfEmpty(fontColor, DEFAULT_FONT_COLOR));
                    return params;
                });
    }

}
