package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserServiceCEImpl;
import com.appsmith.server.solutions.UserChangedHandler;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
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

import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class UserServiceImpl extends UserServiceCEImpl implements UserService {
    private final UserDataService userDataService;
    private final TenantService tenantService;
    private final UserUtils userUtils;
    private final PermissionGroupService permissionGroupService;
    private final CommonConfig commonConfig;
    private final PermissionGroupRepository permissionGroupRepository;
    private final UserGroupRepository userGroupRepository;
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
                           UserUtils userUtils,
                           PermissionGroupRepository permissionGroupRepository,
                           UserGroupRepository userGroupRepository) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService, analyticsService,
                sessionUserService, passwordResetTokenRepository, passwordEncoder, emailSender, applicationRepository,
                policyUtils, commonConfig, emailConfig, userChangedHandler, encryptionService, userDataService, tenantService,
                permissionGroupService, userUtils);

        this.userDataService = userDataService;
        this.tenantService = tenantService;
        this.userUtils = userUtils;
        this.permissionGroupService = permissionGroupService;
        this.commonConfig = commonConfig;
        this.permissionGroupRepository = permissionGroupRepository;
        this.userGroupRepository = userGroupRepository;
    }

    @Override
    public Mono<UserProfileDTO> buildUserProfileDTO(User user) {
        return Mono.zip(
                        super.buildUserProfileDTO(user),
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData()),
                        ReactiveSecurityContextHolder.getContext()
                )
                // Add EE specific metadata to the user profile.
                .flatMap(tuple -> {
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

                    // Add checks to turn on super user mode if required

                    // If the user is already super user, no need to check.
                    if (profile.isSuperUser()) {
                        profile.setAdminSettingsVisible(true);
                        return Mono.just(profile);
                    }

                    // If the user has access to >0 permission groups or >0 user groups, or can read audit logs, then
                    // show them the admin settings page by turning on super admin mode
                    return Mono.zip(
                            permissionGroupRepository.countAllReadablePermissionGroups(),
                            userGroupRepository.countAllReadableUserGroups(),
                            tenantService.getDefaultTenant(AclPermission.READ_TENANT_AUDIT_LOGS)
                                    .switchIfEmpty(Mono.just(new Tenant()))
                    ).map(tuple2 -> {
                        boolean isAnyPermissionGroupReadable = tuple2.getT1() > 0;
                        boolean isAnyUserGroupReadable = tuple2.getT2() > 0;
                        boolean isAuditLogsReadable = tuple2.getT3().getId() != null;
                        if (isAnyPermissionGroupReadable || isAnyUserGroupReadable || isAuditLogsReadable) {
                            profile.setAdminSettingsVisible(true);
                        }
                        return profile;
                    });
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
                    String primaryColor = DEFAULT_PRIMARY_COLOR;
                    String backgroundColor = DEFAULT_BACKGROUND_COLOR;
                    String fontColor = DEFAULT_FONT_COLOR;

                    if (StringUtils.isNotEmpty(origin) && tenantConfiguration.isWhitelabelEnabled()) {
                        logoUrl = origin + tenantConfiguration.getBrandLogoUrl();
                        final TenantConfiguration.BrandColors brandColors = tenantConfiguration.getBrandColors();
                        if (brandColors != null) {
                            primaryColor = StringUtils.defaultIfEmpty(brandColors.getPrimary(), primaryColor);
                            backgroundColor = StringUtils.defaultIfEmpty(brandColors.getBackground(), backgroundColor);
                            fontColor = StringUtils.defaultIfEmpty(brandColors.getFont(), fontColor);
                        }
                    }

                    params.put("instanceName", StringUtils.defaultIfEmpty(commonConfig.getInstanceName(), "Appsmith"));
                    params.put("logoUrl", StringUtils.defaultIfEmpty(logoUrl, DEFAULT_APPSMITH_LOGO));
                    params.put("brandPrimaryColor", primaryColor);
                    params.put("brandBackgroundColor", backgroundColor);
                    params.put("brandFontColor", fontColor);
                    return params;
                });
    }

    @Override
    public Mono<User> userCreate(User user, boolean isAdminUser) {
        Mono<User> userCreateAndDefaultRoleAssignmentMono = super.userCreate(user, isAdminUser)
                // After creating the user, assign the default role to the newly created user.
                .flatMap(createdUser -> userUtils.getDefaultUserPermissionGroup()
                        .flatMap(permissionGroup -> {
                            log.debug("Assigning default user role to newly created user {}", createdUser.getUsername());
                            return permissionGroupService.bulkAssignToUsersWithoutPermission(permissionGroup, List.of(createdUser));
                        })
                        .then(Mono.just(createdUser))
                );

        //  Use a synchronous sink which does not take subscription cancellations into account. This that even if the
        //  subscriber has cancelled its subscription, the user create method will still generate its event.
        return Mono.create(sink -> userCreateAndDefaultRoleAssignmentMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }
}
