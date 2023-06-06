package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_APPSMITH_LOGO;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_BACKGROUND_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_FONT_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_PRIMARY_COLOR;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

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
        Mono<Tenant> tenantWithConfigurationMono = tenantService.getTenantConfiguration().cache();
        Mono<UserProfileDTO> userProfileDTOMono = Mono.zip(
                        super.buildUserProfileDTO(user),
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData()),
                        ReactiveSecurityContextHolder.getContext()
                )
                // Add EE specific metadata to the user profile.
                .flatMap(tuple -> {
                    final UserProfileDTO profile = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    SecurityContext context = tuple.getT3();

                    LoginSource loginSource = user.getSource();

                    // Check here if the user is logged in via oauth, oidc or saml and add the user claims accordingly
                    Authentication authentication = context.getAuthentication();
                    if (authentication instanceof OAuth2AuthenticationToken) {

                        // Add the user claims which contain either :
                        // 1. The OIDC user info claims if the user is logged in via OIDC
                        // 2. The SAML attributes if the user is logged in via SAML
                        profile.setUserClaims(userData.getUserClaims());

                        if (LoginSource.OIDC.equals(loginSource)) {
                            // Add the ID claims here as metadata which can be exposed by the client to appsmith developers
                            profile.setIdToken(userData.getOidcIdTokenClaims());
                        }

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
                            permissionGroupRepository.countAllReadablePermissionGroupsForUser(user),
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
        Mono<UserProfileDTO> userProfileDTOWithRolesAndGroups = Mono.zip(userProfileDTOMono, tenantWithConfigurationMono)
                .flatMap(pair -> {
                    UserProfileDTO userProfileDTO = pair.getT1();
                    Tenant defaultTenantWithConfiguration = pair.getT2();
                    if (Boolean.TRUE.equals(defaultTenantWithConfiguration.getTenantConfiguration().getShowRolesAndGroups())) {
                        Mono<List<String>> rolesUserHasBeenAssignedMono = Mono.just(List.of());
                        Mono<List<String>> groupsUsersIsPartOfMono = Mono.just(List.of());

                        if (StringUtils.isNotEmpty(user.getId())) {
                            rolesUserHasBeenAssignedMono = permissionGroupService.getRoleNamesAssignedToUserIds(Set.of(user.getId())).collectList();
                            groupsUsersIsPartOfMono = userGroupRepository.getAllByUsersIn(Set.of(user.getId()),
                                            Optional.of(List.of(fieldName(QUserGroup.userGroup.name))), Optional.empty())
                                    .map(UserGroup::getName)
                                    .collectList();
                        }
                        return Mono.zip(rolesUserHasBeenAssignedMono, groupsUsersIsPartOfMono)
                                .map(pair2 -> {
                                    List<String> rolesAssigned = pair2.getT1();
                                    List<String> memberOfRoles = pair2.getT2();
                                    userProfileDTO.setRoles(rolesAssigned);
                                    userProfileDTO.setGroups(memberOfRoles);
                                    return userProfileDTO;
                                });
                    }
                    return Mono.just(userProfileDTO);
                });
        return userProfileDTOWithRolesAndGroups;
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
    public Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin) {
        return tenantService.getDefaultTenant()
                .map(tenant -> {
                    final TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    String primaryColor = DEFAULT_PRIMARY_COLOR;
                    String backgroundColor = DEFAULT_BACKGROUND_COLOR;
                    String fontColor = DEFAULT_FONT_COLOR;
                    String logoUrl = StringUtils.isNotEmpty(origin) ? origin + tenantConfiguration.getBrandLogoUrl() : null;

                    if (tenantConfiguration.isWhitelabelEnabled()) {
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