package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.ProvisionResourceMetadata;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.enums.ProvisionStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ProvisionUtils;
import com.appsmith.server.helpers.UserServiceHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.EmailVerificationTokenRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce_compatible.UserServiceCECompatibleImpl;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;
import static com.appsmith.server.constants.FieldName.IS_PROVISIONED;
import static com.appsmith.server.constants.QueryParams.COUNT;
import static com.appsmith.server.constants.QueryParams.EMAIL_FILTER;
import static com.appsmith.server.constants.QueryParams.FILTER_DELIMITER;
import static com.appsmith.server.constants.QueryParams.START_INDEX;
import static com.appsmith.server.constants.ce.FieldNameCE.CLOUD_HOSTED_EXTRA_PROPS;
import static com.appsmith.server.constants.ce.FieldNameCE.EMAIL;
import static com.appsmith.server.constants.ce.FieldNameCE.EVENT_DATA;
import static com.appsmith.server.constants.ce.FieldNameCE.NUMBER_OF_USERS_INVITED;
import static com.appsmith.server.constants.ce.FieldNameCE.USER_EMAILS;
import static com.appsmith.server.enums.ProvisionResourceType.USER;

@Slf4j
@Service
public class UserServiceImpl extends UserServiceCECompatibleImpl implements UserService {
    private final UserDataService userDataService;
    private final TenantService tenantService;
    private final UserUtils userUtils;
    private final PermissionGroupService permissionGroupService;
    private final CommonConfig commonConfig;
    private final PermissionGroupRepository permissionGroupRepository;
    private final UserGroupRepository userGroupRepository;
    private final PolicySolution policySolution;
    private final PolicyGenerator policyGenerator;
    private final ProvisionUtils provisionUtils;
    private final SessionUserService sessionUserService;
    private final PACConfigurationService pacConfigurationService;
    private final UserServiceHelper userServiceHelper;

    public UserServiceImpl(
            Validator validator,
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
            EncryptionService encryptionService,
            UserDataService userDataService,
            TenantService tenantService,
            PermissionGroupService permissionGroupService,
            UserUtils userUtils,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PermissionGroupRepository permissionGroupRepository,
            UserGroupRepository userGroupRepository,
            PolicyGenerator policyGenerator,
            ProvisionUtils provisionUtils,
            EmailService emailService,
            RateLimitService rateLimitService,
            PACConfigurationService pacConfigurationService,
            UserServiceHelper userServiceHelper) {
        super(
                validator,
                repository,
                workspaceService,
                analyticsService,
                sessionUserService,
                passwordResetTokenRepository,
                passwordEncoder,
                commonConfig,
                encryptionService,
                userDataService,
                tenantService,
                userUtils,
                emailVerificationTokenRepository,
                emailService,
                rateLimitService,
                pacConfigurationService,
                userServiceHelper);

        this.userDataService = userDataService;
        this.tenantService = tenantService;
        this.userUtils = userUtils;
        this.permissionGroupService = permissionGroupService;
        this.commonConfig = commonConfig;
        this.permissionGroupRepository = permissionGroupRepository;
        this.userGroupRepository = userGroupRepository;
        this.policySolution = policySolution;
        this.policyGenerator = policyGenerator;
        this.provisionUtils = provisionUtils;
        this.sessionUserService = sessionUserService;
        this.pacConfigurationService = pacConfigurationService;
        this.userServiceHelper = userServiceHelper;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<UserProfileDTO> buildUserProfileDTO(User user) {
        Mono<Tenant> tenantWithConfigurationMono =
                tenantService.getTenantConfiguration().cache();
        Mono<UserProfileDTO> userProfileDTOMono = Mono.zip(
                        super.buildUserProfileDTO(user),
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData()),
                        ReactiveSecurityContextHolder.getContext())
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
                            // Add the ID claims here as metadata which can be exposed by the client to appsmith
                            // developers
                            profile.setIdToken(userData.getOidcIdTokenClaims());
                            profile.setRawIdToken(userData.getRawIdToken());
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
                                    tenantService
                                            .getDefaultTenant(AclPermission.READ_TENANT_AUDIT_LOGS)
                                            .switchIfEmpty(Mono.just(new Tenant())))
                            .map(tuple2 -> {
                                boolean isAnyPermissionGroupReadable = tuple2.getT1() > 0;
                                boolean isAnyUserGroupReadable = tuple2.getT2() > 0;
                                boolean isAuditLogsReadable = tuple2.getT3().getId() != null;
                                if (isAnyPermissionGroupReadable || isAnyUserGroupReadable || isAuditLogsReadable) {
                                    profile.setAdminSettingsVisible(true);
                                }
                                return profile;
                            });
                });
        Mono<UserProfileDTO> userProfileDTOWithRolesAndGroups = Mono.zip(
                        userProfileDTOMono, tenantWithConfigurationMono)
                .flatMap(pair -> {
                    UserProfileDTO userProfileDTO = pair.getT1();
                    Tenant defaultTenantWithConfiguration = pair.getT2();
                    boolean showRolesAndGroups = Optional.of(defaultTenantWithConfiguration)
                            .map(cfg -> cfg.getTenantConfiguration().getShowRolesAndGroups())
                            .orElse(false);

                    return pacConfigurationService.setRolesAndGroups(
                            userProfileDTO, user, showRolesAndGroups, commonConfig.isCloudHosting());
                });
        return userProfileDTOWithRolesAndGroups;
    }

    @Override
    public Flux<User> findAllByIdsIn(Set<String> ids) {
        return repository.findAllById(ids);
    }

    @Override
    public Flux<User> findAllByUsernameIn(Set<String> usernames) {
        return repository.findAllByEmailIn(usernames);
    }

    /**
     * Method to add the metadata related to user.
     * @param user
     * @return
     */
    private ProvisionResourceDto getProvisionResourceDto(User user) {
        ProvisionResourceMetadata metadata = ProvisionResourceMetadata.builder()
                .created(user.getCreatedAt().toString())
                .lastModified(user.getUpdatedAt().toString())
                .resourceType(USER.getValue())
                .build();
        return ProvisionResourceDto.builder().resource(user).metadata(metadata).build();
    }

    private Mono<User> updateProvisioningStatus(User user) {
        return provisionUtils
                .updateProvisioningStatusAndLastUpdatedAt(ProvisionStatus.ACTIVE)
                .thenReturn(user);
    }

    /**
     * The method edits the existing permissions on the User resource for Manage and Delete user permissions.
     * It removes the existing Manage and Delete permissions for the user, so that Instance Admin is not able to delete the user and
     * user themselves are not able to edit their properties.
     * It then gives the Manage and Delete permissions for the user to Provision Role, so that the user can be managed by it.
     * The methods also sets the isProvisioned flag in User resource to True.
     * @param user
     * @return
     */
    private Mono<User> updateProvisionUserPoliciesAndProvisionFlag(User user) {
        return userUtils.getProvisioningRole().flatMap(provisioningRole -> {
            user.setIsProvisioned(Boolean.TRUE);
            Set<Policy> currentUserPolicies = user.getPolicies();
            Set<Policy> userPoliciesWithoutDeleteAndManageUser = currentUserPolicies.stream()
                    .filter(policy -> !policy.getPermission().equals(DELETE_USERS.getValue())
                            && !policy.getPermission().equals(MANAGE_USERS.getValue()))
                    .collect(Collectors.toSet());
            user.setPolicies(userPoliciesWithoutDeleteAndManageUser);
            Map<String, Policy> newDeleteAndManagePolicy = Map.of(
                    DELETE_USERS.getValue(),
                            Policy.builder()
                                    .permission(DELETE_USERS.getValue())
                                    .permissionGroups(Set.of(provisioningRole.getId()))
                                    .build(),
                    MANAGE_USERS.getValue(),
                            Policy.builder()
                                    .permission(MANAGE_USERS.getValue())
                                    .permissionGroups(Set.of(provisioningRole.getId()))
                                    .build());
            policySolution.addPoliciesToExistingObject(newDeleteAndManagePolicy, user);
            return repository.save(user);
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionResourceDto> createProvisionUser(User user) {
        Mono<User> createProvisionedUserMono = userCreate(user, Boolean.FALSE)
                .flatMap(this::updateProvisionUserPoliciesAndProvisionFlag)
                .flatMap(this::updateProvisioningStatus)
                .cache();
        Mono<Long> sendAnalyticsEventForCreatedUserMono =
                createProvisionedUserMono.flatMap(this::sendAnalyticsEventForCreatedUser);
        return sendAnalyticsEventForCreatedUserMono
                .then(createProvisionedUserMono)
                .map(this::getProvisionResourceDto);
    }

    @NotNull private Mono<Long> sendAnalyticsEventForCreatedUser(User createdUser) {
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();
        Mono<User> sendAnalyticsEventMono = currentUserMono.flatMap(currentUser -> {
            Map<String, Object> analyticsProperties = new HashMap<>();
            Map<String, Object> eventData = new HashMap<>();
            eventData.put(USER_EMAILS, List.of(createdUser.getEmail()));
            analyticsProperties.put(NUMBER_OF_USERS_INVITED, 1);
            Map<String, Object> extraPropsForCloudHostedInstance = Map.of(USER_EMAILS, List.of(createdUser.getEmail()));
            analyticsProperties.put(EVENT_DATA, eventData);
            analyticsProperties.put(CLOUD_HOSTED_EXTRA_PROPS, extraPropsForCloudHostedInstance);
            analyticsProperties.put(IS_PROVISIONED, createdUser.getIsProvisioned());
            return analyticsService.sendObjectEvent(
                    AnalyticsEvents.EXECUTE_INVITE_USERS, currentUser, analyticsProperties);
        });
        return sendAnalyticsEventMono.thenReturn(1L);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionResourceDto> updateProvisionUser(String userId, UserUpdateDTO userUpdateDTO) {
        Mono<User> updateUserPolicyPostRead =
                repository.findById(userId, READ_USERS).flatMap(this::updateProvisionUserPoliciesAndProvisionFlag);
        Mono<User> sendScimLinkedEventSendLinkedUserMono = updateUserPolicyPostRead.flatMap(user -> {
            Map<String, Object> analyticsProperties = new HashMap<>();
            analyticsProperties.put(IS_PROVISIONED, user.getIsProvisioned());
            analyticsProperties.put(EMAIL, user.getEmail());
            return analyticsService.sendObjectEvent(AnalyticsEvents.SCIM_LINKED, user, analyticsProperties);
        });

        Mono<User> userMono =
                repository.findById(userId, MANAGE_USERS).switchIfEmpty(sendScimLinkedEventSendLinkedUserMono);
        Mono<ProvisionResourceDto> updatedProvisionedUserMono;
        if (StringUtils.isEmpty(userUpdateDTO.getName()) && StringUtils.isEmpty(userUpdateDTO.getEmail())) {
            updatedProvisionedUserMono = userMono.map(this::getProvisionResourceDto);
        } else {
            User userUpdate = new User();
            if (StringUtils.isNotEmpty(userUpdateDTO.getName())) {
                userUpdate.setName(userUpdateDTO.getName());
            }
            if (StringUtils.isNotEmpty(userUpdateDTO.getEmail())) {
                // Convert email to lower case before saving
                userUpdate.setEmail(userUpdateDTO.getEmail().toLowerCase());
            }
            // Setting below elements to null, so that they are not copied as empty values
            // and update the user resource incorrectly.
            userUpdate.setPolicies(null);
            userUpdate.setIsProvisioned(null);
            updatedProvisionedUserMono = userMono.then(this.update(userId, userUpdate))
                    .flatMap(this::updateProvisioningStatus)
                    .map(this::getProvisionResourceDto);
        }
        return updatedProvisionedUserMono;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionResourceDto> getProvisionUser(String userId) {
        return repository
                .findById(userId, READ_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "User", userId)))
                .flatMap(this::updateProvisioningStatus)
                .map(this::getProvisionResourceDto);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<PagedDomain<ProvisionResourceDto>> getProvisionUsers(MultiValueMap<String, String> queryParams) {
        int count = NO_RECORD_LIMIT;
        int startIndex = 0;
        List<String> emails = List.of();

        if (StringUtils.isNotEmpty(queryParams.getFirst(COUNT))) {
            count = Integer.parseInt(queryParams.getFirst(COUNT));
        }
        if (StringUtils.isNotEmpty(queryParams.getFirst(START_INDEX))) {
            startIndex = Integer.parseInt(queryParams.getFirst(START_INDEX));
        }
        if (StringUtils.isNotEmpty(queryParams.getFirst(EMAIL_FILTER))) {
            emails = Arrays.stream(queryParams.getFirst(EMAIL_FILTER).split(FILTER_DELIMITER))
                    .toList();
        }

        return repository
                .getUsersWithParamsPaginated(count, startIndex, emails, Optional.of(READ_USERS))
                .map(pagedUsers -> {
                    List<ProvisionResourceDto> provisionedUsersDto = pagedUsers.getContent().stream()
                            .map(this::getProvisionResourceDto)
                            .toList();
                    return PagedDomain.<ProvisionResourceDto>builder()
                            .total(pagedUsers.getTotal())
                            .count(pagedUsers.getCount())
                            .startIndex(pagedUsers.getStartIndex())
                            .content(provisionedUsersDto)
                            .build();
                })
                .zipWith(provisionUtils.updateProvisioningStatusAndLastUpdatedAt(ProvisionStatus.ACTIVE))
                .map(pair -> {
                    PagedDomain<ProvisionResourceDto> pagedUsers = pair.getT1();
                    Boolean updateProvisioningStatus = pair.getT2();
                    return pagedUsers;
                });
    }

    @Override
    public Mono<User> userCreate(User user, boolean isAdminUser) {
        Mono<User> userCreateAndDefaultRoleAssignmentMono = super.userCreate(user, isAdminUser)
                // After creating the user, assign the default role to the newly created user.
                .flatMap(createdUser -> userServiceHelper.assignDefaultRoleToUser(user));

        //  Use a synchronous sink which does not take subscription cancellations into account. This that even if the
        //  subscriber has cancelled its subscription, the user create method will still generate its event.
        return Mono.create(sink -> userCreateAndDefaultRoleAssignmentMono.subscribe(
                sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(User savedResource) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put(IS_PROVISIONED, savedResource.getIsProvisioned());
        return analyticsProperties;
    }

    @Override
    public Mono<Boolean> makeUserPristineBasedOnLoginSource(LoginSource loginSource, String tenantId) {
        return repository
                .makeUserPristineBasedOnLoginSourceAndTenantId(loginSource, tenantId)
                .onErrorResume(error -> {
                    log.error("Error while making users pristine for login source: {}", loginSource, error);
                    return Mono.just(false);
                });
    }
}
