package com.appsmith.server.solutions;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PermissionGroupHelper;
import com.appsmith.server.helpers.PermissionGroupHelperImpl;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ce_compatible.UserAndAccessManagementServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.CLOUD_HOSTED_EXTRA_PROPS;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.EVENT_DATA;
import static com.appsmith.server.constants.FieldName.IS_PROVISIONED;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_ASSIGNED_USERS;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_ASSIGNED_USER_GROUPS;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_UNASSIGNED_USERS;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_UNASSIGNED_USER_GROUPS;
import static com.appsmith.server.constants.PaginationConstants.RECORD_LIMIT;
import static com.appsmith.server.constants.QueryParams.START_INDEX;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;
import static java.lang.Boolean.TRUE;

@Component
@Slf4j
public class UserAndAccessManagementServiceImpl extends UserAndAccessManagementServiceCECompatibleImpl
        implements UserAndAccessManagementService {

    private String instanceAdminRoleId = null;

    private final UserGroupService userGroupService;
    private final PermissionGroupService permissionGroupService;
    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final UserGroupRepository userGroupRepository;
    private final AnalyticsService analyticsService;
    private final UserDataRepository userDataRepository;
    private final PermissionGroupPermission permissionGroupPermission;
    private final PermissionGroupHelper permissionGroupHelper;
    private final EnvManager envManager;
    private final ConfigRepository configRepository;
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final EmailService emailService;

    private final ApplicationService applicationService;

    public UserAndAccessManagementServiceImpl(
            SessionUserService sessionUserService,
            PermissionGroupService permissionGroupService,
            WorkspaceService workspaceService,
            UserRepository userRepository,
            AnalyticsService analyticsService,
            UserService userService,
            UserGroupService userGroupService,
            TenantService tenantService,
            PermissionGroupRepository permissionGroupRepository,
            UserGroupRepository userGroupRepository,
            PermissionGroupPermission permissionGroupPermission,
            UserDataRepository userDataRepository,
            PermissionGroupHelperImpl permissionGroupHelper,
            EnvManager envManager,
            ConfigRepository configRepository,
            EmailService emailService,
            CommonConfig commonConfig,
            ApplicationService applicationService) {

        super(
                sessionUserService,
                permissionGroupService,
                workspaceService,
                userRepository,
                analyticsService,
                userService,
                permissionGroupPermission,
                emailService,
                commonConfig);

        this.permissionGroupService = permissionGroupService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.userGroupService = userGroupService;
        this.tenantService = tenantService;
        this.permissionGroupRepository = permissionGroupRepository;
        this.userGroupRepository = userGroupRepository;
        this.analyticsService = analyticsService;
        this.userDataRepository = userDataRepository;
        this.permissionGroupPermission = permissionGroupPermission;
        this.permissionGroupHelper = permissionGroupHelper;
        this.envManager = envManager;
        this.configRepository = configRepository;
        this.sessionUserService = sessionUserService;
        this.workspaceService = workspaceService;
        this.emailService = emailService;
        this.applicationService = applicationService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PagedDomain<UserForManagementDTO>> getAllUsers(MultiValueMap<String, String> queryParams) {

        int startIndex;
        int pageSize = RECORD_LIMIT;
        Mono<Long> totalUserCountMono = Mono.just(-1L);

        if (StringUtils.hasLength(queryParams.getFirst(START_INDEX))) {
            startIndex = Integer.parseInt(queryParams.getFirst(START_INDEX));
        } else {
            // default to zero in case no start index has been provided
            startIndex = 0;
            // Only fetch the total count (aka a heavy query) if the startIndex is 0. In other words, when the API is
            // called the first time. Else we can just return -1 as the total count.
            totalUserCountMono = userRepository.countAllUsers(queryParams, READ_USERS);
        }

        Mono<List<UserForManagementDTO>> userListMono = tenantService
                .getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_READ_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMapMany(tenant -> userRepository
                        .getAllUserObjectsWithEmail(
                                tenant.getId(), queryParams, startIndex, pageSize, Optional.of(READ_USERS))
                        .flatMap(userRepository::setUserPermissionsInObject))
                .flatMapSequential(user -> {
                    Mono<String> photoIdForUserMono = getPhotoIdForUser(user.getId());
                    Mono<UserForManagementDTO> userDTO_WithGroupsAndRolesMono = addGroupsAndRolesForUser(user);

                    return Mono.zip(photoIdForUserMono, userDTO_WithGroupsAndRolesMono)
                            .map(tuple -> {
                                String photoId = tuple.getT1();
                                UserForManagementDTO userDTO = tuple.getT2();

                                // If the user's photo has been set, then set it in the response.
                                if (StringUtils.hasLength(photoId)) {
                                    userDTO.setPhotoId(photoId);
                                }

                                return userDTO;
                            });
                })
                .collectList();

        return Mono.zip(totalUserCountMono, userListMono).map(tuple -> {
            Long totalUsers = tuple.getT1();
            List<UserForManagementDTO> userForManagementDTOList = tuple.getT2();
            return new PagedDomain<>(userForManagementDTOList, userForManagementDTOList.size(), startIndex, totalUsers);
        });
    }

    private Mono<String> getPhotoIdForUser(String userId) {

        return userDataRepository
                .findByUserId(userId)
                .switchIfEmpty(Mono.just(new UserData()))
                .map(userData -> {
                    String profilePhotoAssetId = userData.getProfilePhotoAssetId();
                    if (StringUtils.hasLength(profilePhotoAssetId)) {
                        return profilePhotoAssetId;
                    }
                    return "";
                });
    }

    @Override
    public Mono<UserForManagementDTO> getUserById(String userId) {
        return tenantService
                .getDefaultTenantId()
                // By design, this service layer is open only to instance administrators today.
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_READ_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(tenant -> userRepository.findById(userId, READ_USERS))
                // Add the name of the user in response.
                .flatMap(user -> {
                    Mono<String> photoIdForUserMono = getPhotoIdForUser(user.getId());
                    Mono<UserForManagementDTO> userDTO_WithGroupsAndRolesMono = addGroupsAndRolesForUser(user);

                    return Mono.zip(photoIdForUserMono, userDTO_WithGroupsAndRolesMono)
                            .map(tuple -> {
                                String photoId = tuple.getT1();
                                UserForManagementDTO userDTO = tuple.getT2();
                                userDTO.setPhotoId(photoId);
                                return userDTO;
                            })
                            .map(dto -> {
                                String name = user.getName();
                                if (StringUtils.hasLength(name)) {
                                    dto.setName(name);
                                } else {
                                    dto.setName(user.getUsername());
                                }
                                return dto;
                            });
                });
    }

    private Mono<UserForManagementDTO> addGroupsAndRolesForUser(User user) {
        Flux<PermissionGroupInfoDTO> rolesAssignedToUserFlux = permissionGroupHelper.mapToPermissionGroupInfoDto(
                permissionGroupService.findAllByAssignedToUsersIn(Set.of(user.getId())));
        Flux<UserGroupCompactDTO> groupsForUser = userGroupService.findAllGroupsForUserWithoutPermission(user.getId());

        return Mono.zip(rolesAssignedToUserFlux.collectList(), groupsForUser.collectList())
                .map(tuple -> {
                    List<PermissionGroupInfoDTO> rolesInfo = tuple.getT1();
                    List<UserGroupCompactDTO> groupsInfo = tuple.getT2();
                    return new UserForManagementDTO(
                            user.getId(),
                            user.getUsername(),
                            groupsInfo,
                            rolesInfo,
                            user.getIsProvisioned(),
                            user.getUserPermissions());
                });
    }

    @Override
    public Mono<Boolean> deleteUser(String userId) {

        // Only the instance admins and the user themselves can delete the user.
        return userRepository
                .findById(userId, DELETE_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(tenant -> userRepository.findById(userId))
                .flatMap(user -> {
                    Mono<Set<String>> permissionGroupIdsMono = permissionGroupService
                            .findAllByAssignedToUserIdsInWithoutPermission(Set.of(user.getId()))
                            .map(PermissionGroup::getId)
                            .collect(Collectors.toSet());
                    Mono<Set<String>> groupIdsMono = userGroupService
                            .findAllGroupsForUserWithoutPermission(user.getId())
                            .map(UserGroupCompactDTO::getId)
                            .collect(Collectors.toSet());

                    Mono<Boolean> unassignedFromRolesMono = permissionGroupIdsMono.flatMap(permissionGroupIds ->
                            permissionGroupService.bulkUnassignUserFromPermissionGroupsWithoutPermission(
                                    user, permissionGroupIds));

                    Mono<Boolean> removedFromGroupsMono = groupIdsMono.flatMap(
                            groupIds -> userGroupService.bulkRemoveUserFromGroupsWithoutPermission(user, groupIds));

                    Mono<Void> cleanPermissionGroupCacheMono =
                            permissionGroupService.cleanPermissionGroupCacheForUsers(List.of(user.getId()));

                    Mono<Void> deleteUserMono = userRepository.deleteById(userId);
                    Mono<Void> deleteUserDataMono = userDataRepository
                            .findByUserId(userId)
                            .flatMap(userData -> userDataRepository.deleteById(userData.getId()));
                    Map<String, Object> analyticsProperties = Map.of(IS_PROVISIONED, user.getIsProvisioned());
                    Mono<User> userDeletedEvent = analyticsService.sendDeleteEvent(user, analyticsProperties);

                    Mono<Tuple2<Void, Void>> deleteUserAndDataMono = Mono.zip(deleteUserMono, deleteUserDataMono);

                    return Mono.zip(unassignedFromRolesMono, removedFromGroupsMono)
                            .then(deleteUserAndDataMono)
                            .then(userDeletedEvent)
                            .then(cleanPermissionGroupCacheMono)
                            .thenReturn(TRUE);
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<Boolean> changeRoleAssociations(
            UpdateRoleAssociationDTO updateRoleAssociationDTO, String originHeader) {
        Set<UserCompactDTO> userDTOs = updateRoleAssociationDTO.getUsers();
        Set<UserGroupCompactDTO> groupDTOs = updateRoleAssociationDTO.getGroups();
        Set<PermissionGroupCompactDTO> rolesAddedDTOs = updateRoleAssociationDTO.getRolesAdded();
        Set<PermissionGroupCompactDTO> rolesRemovedDTOs = updateRoleAssociationDTO.getRolesRemoved();
        Set<String> roleIdsToBeUpdated = new HashSet<>();

        Flux<User> userFlux = Flux.empty();
        Flux<UserGroup> groupFlux = Flux.empty();
        Flux<PermissionGroup> rolesAddedFlux = Flux.empty();
        Flux<PermissionGroup> rolesRemovedFlux = Flux.empty();
        Mono<Boolean> isMultipleRolesFromWorkspacePresentMono = Mono.just(TRUE);
        Mono<Boolean> rolesFromSameWorkspaceExistsInUsersMono;
        Mono<Boolean> rolesFromSameWorkspaceExistsInUserGroupsMono;
        Mono<Boolean> instanceRoleUpdatedForUsersAndEnvAdminEmailsUpdatedMono = Mono.just(TRUE);

        if (!CollectionUtils.isEmpty(rolesAddedDTOs)) {
            roleIdsToBeUpdated.addAll(rolesAddedDTOs.stream()
                    .map(PermissionGroupCompactDTO::getId)
                    .collect(Collectors.toSet()));
            Flux<PermissionGroup> rolesToBeAddedFlux = permissionGroupRepository
                    .findAllById(rolesAddedDTOs.stream()
                            .map(PermissionGroupCompactDTO::getId)
                            .collect(Collectors.toSet()))
                    .cache();
            rolesAddedFlux = UserPermissionUtils.validateDomainObjectPermissionsOrError(
                            rolesToBeAddedFlux.map(role -> role),
                            FieldName.ROLE,
                            permissionGroupService.getSessionUserPermissionGroupIds(),
                            permissionGroupPermission.getAssignPermission(),
                            AppsmithError.ASSIGN_UNASSIGN_MISSING_PERMISSION)
                    .thenMany(rolesToBeAddedFlux)
                    .cache();

            isMultipleRolesFromWorkspacePresentMono =
                    rolesAddedFlux.collectList().flatMap(this::containsPermissionGroupsFromSameWorkspace);
        }
        if (!CollectionUtils.isEmpty(rolesRemovedDTOs)) {
            roleIdsToBeUpdated.addAll(rolesRemovedDTOs.stream()
                    .map(PermissionGroupCompactDTO::getId)
                    .collect(Collectors.toSet()));
            Flux<PermissionGroup> rolesToBeRemovedFlux = permissionGroupRepository
                    .findAllById(rolesRemovedDTOs.stream()
                            .map(PermissionGroupCompactDTO::getId)
                            .collect(Collectors.toSet()))
                    .cache();
            rolesRemovedFlux = UserPermissionUtils.validateDomainObjectPermissionsOrError(
                            rolesToBeRemovedFlux.map(role -> role),
                            FieldName.ROLE,
                            permissionGroupService.getSessionUserPermissionGroupIds(),
                            permissionGroupPermission.getUnAssignPermission(),
                            AppsmithError.ASSIGN_UNASSIGN_MISSING_PERMISSION)
                    .thenMany(rolesToBeRemovedFlux);
        }
        if (!CollectionUtils.isEmpty(userDTOs)) {
            userFlux = Flux.fromIterable(
                            userDTOs.stream().map(UserCompactDTO::getUsername).collect(Collectors.toSet()))
                    .flatMap(username -> {
                        User newUser = new User();
                        newUser.setEmail(username.toLowerCase());
                        newUser.setIsEnabled(false);
                        return userService.findByEmail(username).switchIfEmpty(userService.userCreate(newUser, false));
                    })
                    .cache();
            instanceRoleUpdatedForUsersAndEnvAdminEmailsUpdatedMono =
                    this.checkInstanceAdminUpdatedAndUpdateAdminEmails(roleIdsToBeUpdated);
        }

        if (!CollectionUtils.isEmpty(groupDTOs)) {
            groupFlux = userGroupRepository
                    .findAllById(
                            groupDTOs.stream().map(UserGroupCompactDTO::getId).collect(Collectors.toSet()))
                    .cache();
        }

        // Checks and throws error, if 2 or more permission groups from the same Default Workspace ID are present
        // in COMBINED_LIST.
        // PG_LIST1: All Permission Groups a user already has.
        // PG_LIST2: All Permission Groups a user will now be associated to.
        // PG_LIST3: All Permission Groups a user will now be disassociated from.
        // COMBINED_LIST: PG_LIST1 + PG_LIST2 - PG_LIST3
        rolesFromSameWorkspaceExistsInUsersMono = this.hasMultipleRolesFromSameWorkspaceMono(
                userFlux.flatMap(user -> permissionGroupService
                        .findAllByAssignedToUserId(user.getId())
                        .collectList()),
                rolesAddedFlux,
                rolesRemovedFlux);
        rolesFromSameWorkspaceExistsInUserGroupsMono = this.hasMultipleRolesFromSameWorkspaceMono(
                groupFlux.flatMap(user -> permissionGroupService
                        .findAllByAssignedToGroupId(user.getId())
                        .collectList()),
                rolesAddedFlux,
                rolesRemovedFlux);

        // Bulk assign to roles added
        Flux<PermissionGroup> bulkAssignToRolesFlux = Flux.zip(
                        rolesAddedFlux,
                        userFlux.collectList().repeat(),
                        groupFlux.collectList().repeat())
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();
                    return bulkAssignToUsersAndGroups(permissionGroup, users, groups);
                });

        // Bulk unassign from roles removed
        Flux<PermissionGroup> bulkUnassignFromRolesFlux = Flux.zip(
                        rolesRemovedFlux,
                        userFlux.collectList().repeat(),
                        groupFlux.collectList().repeat())
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();
                    return bulkUnassignFromUsersAndGroups(permissionGroup, users, groups);
                });

        // Clear cache for all the affected users
        Mono<Void> cleanCacheForUsersMono = Mono.zip(userFlux.collectList(), groupFlux.collectList())
                .flatMap(tuple -> {
                    List<User> users = tuple.getT1();
                    List<UserGroup> groups = tuple.getT2();
                    List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
                    // Get the userIds from all the user groups that we are unassigning
                    List<String> usersInGroups = groups.stream()
                            .map(UserGroup::getUsers)
                            .flatMap(Collection::stream)
                            .collect(Collectors.toList());
                    userIds.addAll(usersInGroups);
                    return permissionGroupService.cleanPermissionGroupCacheForUsers(userIds);
                });

        Mono<Tenant> tenantConfigMono = tenantService.getTenantConfiguration();
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();
        Flux<User> finalUserFlux = userFlux;
        Flux<PermissionGroup> finalRolesAddedFlux = rolesAddedFlux;

        return Mono.when(isMultipleRolesFromWorkspacePresentMono)
                .then(Mono.when(rolesFromSameWorkspaceExistsInUsersMono, rolesFromSameWorkspaceExistsInUserGroupsMono))
                .then(Mono.when(bulkAssignToRolesFlux.collectList(), bulkUnassignFromRolesFlux.collectList()))
                .then(cleanCacheForUsersMono)
                .then(instanceRoleUpdatedForUsersAndEnvAdminEmailsUpdatedMono)
                .then(tenantConfigMono)
                .flatMap(tenant -> sendUserInvitationEmails(
                        currentUserMono,
                        finalUserFlux.collectList(),
                        finalRolesAddedFlux.collectList(),
                        tenant.getTenantConfiguration().getInstanceName(),
                        originHeader));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<Boolean> unAssignUsersAndGroupsFromAllAssociatedRoles(List<User> users, List<UserGroup> groups) {
        Set<String> userIds = users.stream().map(User::getId).collect(Collectors.toSet());
        Set<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());
        Flux<PermissionGroup> allRolesByAssignedToUsersInFlux =
                permissionGroupService.findAllByAssignedToUserIdsInWithoutPermission(userIds);
        Flux<PermissionGroup> allRolesByAssignedToGroupIdsInFlux =
                permissionGroupService.findAllByAssignedToGroupIdsInWithoutPermission(groupIds);

        Mono<List<PermissionGroup>> allInterestingRolesMono = Flux.merge(
                        allRolesByAssignedToGroupIdsInFlux, allRolesByAssignedToUsersInFlux)
                .collectList();

        return allInterestingRolesMono.flatMap(
                allRoles -> permissionGroupService.bulkUnAssignUsersAndUserGroupsFromPermissionGroupsWithoutPermission(
                        users, groups, allRoles));
    }

    private Mono<PermissionGroup> bulkAssignToUsersAndGroups(
            PermissionGroup permissionGroup, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(permissionGroup);
        ensureAssignedToUserGroups(permissionGroup);

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toList());
        permissionGroup.getAssignedToUserIds().addAll(userIds);
        permissionGroup.getAssignedToGroupIds().addAll(groupIds);
        List<String> usernames = users.stream().map(User::getUsername).collect(Collectors.toList());
        List<String> userGroupNames = groups.stream().map(UserGroup::getName).collect(Collectors.toList());
        return permissionGroupRepository
                .updateById(permissionGroup.getId(), permissionGroup, AclPermission.ASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)))
                .flatMap(permissionGroup1 -> {
                    Map<String, Object> eventData = Map.of(
                            FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS,
                            usernames,
                            FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS,
                            userGroupNames);
                    Map<String, Object> extraPropsForCloudHostedInstance = Map.of(
                            FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS,
                            usernames,
                            FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS,
                            userGroupNames);
                    Map<String, Object> analyticsProperties = Map.of(
                            NUMBER_OF_ASSIGNED_USERS,
                            usernames.size(),
                            NUMBER_OF_ASSIGNED_USER_GROUPS,
                            userGroupNames.size(),
                            EVENT_DATA,
                            eventData,
                            CLOUD_HOSTED_EXTRA_PROPS,
                            extraPropsForCloudHostedInstance);
                    AnalyticsEvents assignedEvent;
                    if (!usernames.isEmpty() && !userGroupNames.isEmpty()) {
                        assignedEvent = AnalyticsEvents.ASSIGNED_TO_PERMISSION_GROUP;
                    } else if (!usernames.isEmpty()) {
                        assignedEvent = AnalyticsEvents.ASSIGNED_USERS_TO_PERMISSION_GROUP;
                    } else {
                        assignedEvent = AnalyticsEvents.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUP;
                    }
                    return analyticsService.sendObjectEvent(assignedEvent, permissionGroup1, analyticsProperties);
                });
    }

    private Mono<PermissionGroup> bulkUnassignFromUsersAndGroups(
            PermissionGroup permissionGroup, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(permissionGroup);
        ensureAssignedToUserGroups(permissionGroup);

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toList());
        userIds.forEach(permissionGroup.getAssignedToUserIds()::remove);
        groupIds.forEach(permissionGroup.getAssignedToGroupIds()::remove);
        List<String> usernames = users.stream().map(User::getUsername).collect(Collectors.toList());
        List<String> userGroupNames = groups.stream().map(UserGroup::getName).collect(Collectors.toList());
        return permissionGroupRepository
                .updateById(permissionGroup.getId(), permissionGroup, UNASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)))
                .flatMap(pg -> {
                    Map<String, Object> eventData = Map.of(
                            FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS,
                            usernames,
                            FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS,
                            userGroupNames);
                    Map<String, Object> extraPropsForCloudHostedInstance = Map.of(
                            FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS,
                            usernames,
                            FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS,
                            userGroupNames);
                    Map<String, Object> analyticsProperties = Map.of(
                            NUMBER_OF_UNASSIGNED_USERS,
                            usernames.size(),
                            NUMBER_OF_UNASSIGNED_USER_GROUPS,
                            userGroupNames.size(),
                            EVENT_DATA,
                            eventData,
                            CLOUD_HOSTED_EXTRA_PROPS,
                            extraPropsForCloudHostedInstance);
                    AnalyticsEvents unassignedEvent;
                    if (!usernames.isEmpty() && !userGroupNames.isEmpty())
                        unassignedEvent = AnalyticsEvents.UNASSIGNED_FROM_PERMISSION_GROUP;
                    else if (!usernames.isEmpty())
                        unassignedEvent = AnalyticsEvents.UNASSIGNED_USERS_FROM_PERMISSION_GROUP;
                    else unassignedEvent = AnalyticsEvents.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUP;
                    return analyticsService.sendObjectEvent(unassignedEvent, pg, analyticsProperties);
                });
    }

    protected void ensureAssignedToUserIds(PermissionGroup permissionGroup) {
        if (permissionGroup.getAssignedToUserIds() == null) {
            permissionGroup.setAssignedToUserIds(new HashSet<>());
        }
    }

    protected void ensureAssignedToUserGroups(PermissionGroup permissionGroup) {
        if (permissionGroup.getAssignedToGroupIds() == null) {
            permissionGroup.setAssignedToUserIds(new HashSet<>());
        }
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader) {

        Mono<List<User>> inviteIndividualUsersMono = Mono.just(List.of());
        Mono<Boolean> inviteGroupsMono = Mono.just(TRUE);
        Mono<List<User>> sendEmailsMono = Mono.just(List.of());

        List<String> usernames = inviteUsersDTO.getUsernames();
        if (!CollectionUtils.isEmpty(usernames)) {
            inviteIndividualUsersMono =
                    super.inviteUsers(inviteUsersDTO, originHeader).cache();
        }

        Set<String> groups = inviteUsersDTO.getGroups();
        String permissionGroupId = inviteUsersDTO.getPermissionGroupId();

        if (!CollectionUtils.isEmpty(groups)) {
            Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

            Mono<PermissionGroup> permissionGroupMono = permissionGroupService
                    .getById(inviteUsersDTO.getPermissionGroupId(), permissionGroupPermission.getAssignPermission())
                    .filter(permissionGroup ->
                            permissionGroup.getDefaultDomainType().equals(Workspace.class.getSimpleName())
                                    && StringUtils.hasText(permissionGroup.getDefaultDomainId()))
                    .switchIfEmpty(
                            Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ROLE)))
                    .cache();
            // Get workspace from the default group.
            Mono<Workspace> workspaceMono = permissionGroupMono
                    .flatMap(permissionGroup -> workspaceService.getById(permissionGroup.getDefaultDomainId()))
                    .cache();

            // Get all the default permision groups of the workspace
            Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceMono
                    .flatMap(workspace -> permissionGroupService
                            .findAllByIds(workspace.getDefaultPermissionGroups())
                            .collectList())
                    .cache();

            // find all unique users from the groups
            Mono<List<UserGroup>> groupListMono =
                    userGroupRepository.findAllById(groups).collectList();
            Mono<List<User>> uniqueUserListMono = groupListMono
                    .flatMapMany(Flux::fromIterable)
                    .flatMap(userGroup -> Flux.fromIterable(userGroup.getUsers()))
                    .distinct()
                    .collectList()
                    .flatMap(userIds ->
                            userService.findAllByIdsIn(new HashSet<>(userIds)).collectList());

            // find users who haven't been invited yet via user invite flow
            Mono<List<User>> groupsUsersWithNoEmailsSentMono = Mono.zip(uniqueUserListMono, inviteIndividualUsersMono)
                    .map(tuple -> {
                        List<User> uniqueUsers = tuple.getT1();
                        List<User> inviteIndividualUsers = tuple.getT2();

                        Set<String> idsToRemove =
                                inviteIndividualUsers.stream().map(User::getId).collect(Collectors.toSet());

                        return uniqueUsers.stream()
                                .filter(user -> !idsToRemove.contains(user.getId()))
                                .toList();
                    });

            /* send mails to the users who haven't been invited yet via user invite flow
             * only if they don't belong to the workspace already
             */
            sendEmailsMono = groupsUsersWithNoEmailsSentMono.flatMap(
                    users -> Mono.zip(currentUserMono, permissionGroupMono, workspaceMono, defaultPermissionGroupsMono)
                            .flatMap(tuple -> {
                                User currentUser = tuple.getT1();
                                PermissionGroup permissionGroup = tuple.getT2();
                                Workspace workspace = tuple.getT3();
                                List<PermissionGroup> defaultPermissionGroups = tuple.getT4();

                                return Flux.fromIterable(users)
                                        .flatMap(user -> {
                                            boolean shouldSkip = defaultPermissionGroups.stream()
                                                    .anyMatch(pg -> pg.getAssignedToUserIds()
                                                            .contains(user.getId()));

                                            if (shouldSkip) {
                                                return Mono.empty();
                                            } else {
                                                return emailService
                                                        .sendInviteUserToWorkspaceEmail(
                                                                currentUser,
                                                                user,
                                                                workspace,
                                                                permissionGroup,
                                                                originHeader,
                                                                false)
                                                        .thenReturn(user); // Return the user after processing
                                            }
                                        })
                                        .collectList(); // Collect the list of users after sending emails
                            }));

            Set<UserGroupCompactDTO> groupCompactDTOS =
                    groups.stream().map(id -> new UserGroupCompactDTO(id, null)).collect(Collectors.toSet());

            UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
            updateRoleAssociationDTO.setGroups(groupCompactDTOS);
            updateRoleAssociationDTO.setRolesAdded(Set.of(new PermissionGroupCompactDTO(permissionGroupId, null)));

            inviteGroupsMono = this.changeRoleAssociations(updateRoleAssociationDTO, originHeader);
        }

        Mono<Boolean> finalInviteGroupsMono = inviteGroupsMono;
        Mono<List<User>> finalSendEmailsMono = sendEmailsMono;

        return inviteIndividualUsersMono.flatMap(
                users -> finalInviteGroupsMono.then(finalSendEmailsMono).thenReturn(users));
    }

    // Takes a list of PermissionGroups and from them, extract the Highest level of permission, if there exists
    // permission groups from the same DefaultWorkspaceId
    // By highest, here we mean the following:
    // ADMINISTRATOR > DEVELOPER > VIEWER
    // So, if any 2 or 3 of these permission groups from the same default workspace id are present, we are going to
    // send only ONE
    private List<PermissionGroup> prunePermissionGroups(List<PermissionGroup> permissionGroups) {
        List<PermissionGroup> nonAutoCreatedPermissionGroups = permissionGroups.stream()
                .filter(pg -> Objects.isNull(pg.getDefaultDomainType()))
                .collect(Collectors.toList());
        List<PermissionGroup> highestOrderAutoCreatedPgs = permissionGroups.stream()
                .filter(pg -> Objects.nonNull(pg.getDefaultDomainType()))
                .toList()
                .stream()
                .collect(Collectors.groupingBy(PermissionGroup::getDefaultDomainId))
                .values()
                .stream()
                .map(pgList -> {
                    pgList.sort(permissionGroupComparator());
                    return pgList.get(0);
                })
                .collect(Collectors.toList());
        return Stream.of(nonAutoCreatedPermissionGroups, highestOrderAutoCreatedPgs)
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
    }

    private Comparator<PermissionGroup> permissionGroupComparator() {
        return new Comparator<>() {
            @Override
            public int compare(PermissionGroup pg1, PermissionGroup pg2) {
                return getOrder(pg1) - getOrder(pg2);
            }

            private int getOrder(PermissionGroup pg) {
                if (pg.getName().startsWith(ADMINISTRATOR)) return 0;
                else if (pg.getName().startsWith(DEVELOPER)) return 1;
                return 2;
            }
        };
    }

    // Checks if there exists Permission Groups from the same Workspace or not
    private Mono<Boolean> containsPermissionGroupsFromSameWorkspace(List<PermissionGroup> permissionGroups) {
        if (CollectionUtils.isEmpty(permissionGroups)) return Mono.just(TRUE);
        List<PermissionGroup> prunedPermissionGroups = this.prunePermissionGroups(permissionGroups);
        if (permissionGroups.size() != prunedPermissionGroups.size())
            return Mono.error(new AppsmithException(AppsmithError.ROLES_FROM_SAME_WORKSPACE));
        return Mono.just(TRUE);
    }

    // The function takes Flux List of Permission Groups as permissionGroupListFlux, and to that,
    // append the Flux of Permission Groups as addedPermissionGroupFlux, and
    // remove the Flux of Permission Groups as removedPermissionGroupFlux
    // In order to do that, we first remove all removedPermissionGroupFlux from both permissionGroupListFlux and
    // addedPermissionGroupFlux,
    // and then add the above result.
    private Mono<Boolean> hasMultipleRolesFromSameWorkspaceMono(
            Flux<List<PermissionGroup>> permissionGroupListFlux,
            Flux<PermissionGroup> addedPermissionGroupFlux,
            Flux<PermissionGroup> removedPermissionGroupFlux) {
        Mono<Tuple2<List<PermissionGroup>, List<PermissionGroup>>> combinedPermissionGroupsMono =
                addedPermissionGroupFlux.collectList().zipWith(removedPermissionGroupFlux.collectList());
        return permissionGroupListFlux
                .zipWith(combinedPermissionGroupsMono.repeat())
                .flatMap(tuple -> {
                    Map<String, PermissionGroup> userHasPermissionsMap =
                            tuple.getT1().stream().collect(Collectors.toMap(BaseDomain::getId, pg -> pg));
                    Map<String, PermissionGroup> addRequestedPermissionsMap =
                            tuple.getT2().getT1().stream().collect(Collectors.toMap(BaseDomain::getId, pg -> pg));
                    ;
                    List<PermissionGroup> removeRequestedPermissions =
                            tuple.getT2().getT2();
                    removeRequestedPermissions.forEach(pg -> userHasPermissionsMap.remove(pg.getId()));
                    removeRequestedPermissions.forEach(pg -> addRequestedPermissionsMap.remove(pg.getId()));
                    return containsPermissionGroupsFromSameWorkspace(
                            Stream.of(userHasPermissionsMap.values(), addRequestedPermissionsMap.values())
                                    .flatMap(Collection::stream)
                                    .collect(Collectors.toList()));
                })
                .filter(noDuplicateExists -> !noDuplicateExists)
                .hasElements()
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ROLES_FROM_SAME_WORKSPACE)));
    }

    private Mono<Boolean> checkInstanceAdminUpdatedAndUpdateAdminEmails(Set<String> permissionGroupIdSet) {
        return getInstanceAdminRoleId().flatMap(id -> {
            Mono<Void> updateAdminEmailsInEnvMono = Mono.empty();
            if (permissionGroupIdSet.contains(id)) {
                updateAdminEmailsInEnvMono = permissionGroupRepository
                        .findById(id)
                        .flatMapMany(instanceAdminRole ->
                                userRepository.findAllById(instanceAdminRole.getAssignedToUserIds()))
                        .collectList()
                        .flatMap(userList -> {
                            String adminEmails = String.join(
                                    ",", userList.stream().map(User::getEmail).toList());
                            Map<String, String> envUpdateInstanceAdminUserEmails =
                                    Map.of(APPSMITH_ADMIN_EMAILS.name(), adminEmails);
                            return envManager.applyChanges(envUpdateInstanceAdminUserEmails, "");
                        });
            }
            return updateAdminEmailsInEnvMono.thenReturn(TRUE);
        });
    }

    private Mono<String> getInstanceAdminRoleId() {
        if (StringUtils.hasText(instanceAdminRoleId)) {
            return Mono.just(instanceAdminRoleId);
        }
        return configRepository
                .findByName(INSTANCE_CONFIG)
                .map(configObj -> configObj.getConfig().getAsString(DEFAULT_PERMISSION_GROUP))
                .doOnNext(id -> instanceAdminRoleId = id);
    }

    private Mono<Boolean> sendUserInvitationEmails(
            Mono<User> invitingUser,
            Mono<List<User>> invitedUsers,
            Mono<List<PermissionGroup>> rolesAdded,
            String instanceName,
            String originHeader) {

        return Mono.zip(invitingUser, invitedUsers, rolesAdded).flatMap(tuple -> {
            User inviter = tuple.getT1();
            List<User> invitedUserList = tuple.getT2();
            List<PermissionGroup> rolesAddedList = tuple.getT3();
            List<PermissionGroup> workspaceRoles = getWorkspaceRoles(rolesAddedList);
            List<PermissionGroup> applicationRoles = getApplicationRoles(rolesAddedList);
            List<PermissionGroup> notWorkspaceOrApplicationRoles = rolesAddedList.stream()
                    .filter(role -> !workspaceRoles.contains(role) && !applicationRoles.contains(role))
                    .toList();

            Mono<Boolean> workspaceInviteEmailsMono = Flux.fromIterable(invitedUserList)
                    .flatMap(invitedUser -> Flux.fromIterable(workspaceRoles)
                            .flatMap(role -> workspaceService
                                    .getById(role.getDefaultDomainId())
                                    .flatMap(workspace -> emailService.sendInviteUserToWorkspaceEmail(
                                            inviter,
                                            invitedUser,
                                            workspace,
                                            role,
                                            originHeader,
                                            !invitedUser.isEnabled()))
                                    .map(success -> true)
                                    .onErrorReturn(false))
                            .collectList()
                            .map(successList -> successList.stream().allMatch(Boolean::booleanValue)))
                    .collectList()
                    .map(successList -> successList.stream().allMatch(Boolean::booleanValue))
                    .defaultIfEmpty(false);

            Mono<Boolean> applicationInviteEmailsMono = Flux.fromIterable(invitedUserList)
                    .flatMap(invitedUser -> Flux.fromIterable(applicationRoles)
                            .flatMap(role -> applicationService
                                    .getById(role.getDefaultDomainId())
                                    .flatMap(application -> emailService.sendInviteUserToApplicationEmail(
                                            inviter,
                                            invitedUser,
                                            application,
                                            role.getName(),
                                            originHeader,
                                            instanceName,
                                            !invitedUser.isEnabled()))
                                    .map(success -> true)
                                    .onErrorReturn(false))
                            .collectList()
                            .map(successList -> successList.stream().allMatch(Boolean::booleanValue)))
                    .collectList()
                    .map(successList -> successList.stream().allMatch(Boolean::booleanValue))
                    .defaultIfEmpty(false);

            Mono<Boolean> notWorkspaceOrApplicationInviteEmailsMono = Flux.fromIterable(invitedUserList)
                    .flatMap(invitedUser -> Flux.fromIterable(notWorkspaceOrApplicationRoles)
                            .flatMap(role -> emailService.sendInviteUserToInstanceEmail(
                                    inviter, invitedUser, role.getName(), instanceName, originHeader))
                            .all(success -> success)
                            .defaultIfEmpty(false))
                    .all(success -> success)
                    .defaultIfEmpty(false);

            return Mono.zip(
                            workspaceInviteEmailsMono,
                            applicationInviteEmailsMono,
                            notWorkspaceOrApplicationInviteEmailsMono)
                    .map(tuple1 -> tuple1.getT1() && tuple1.getT2() && tuple1.getT3());
        });
    }

    private List<PermissionGroup> getWorkspaceRoles(List<PermissionGroup> permissionGroups) {
        return permissionGroups.stream()
                .filter(permissionGroup -> {
                    String entityType = permissionGroup.getDefaultDomainType();
                    return entityType != null && entityType.equals(Workspace.class.getSimpleName());
                })
                .collect(Collectors.toList());
    }

    private List<PermissionGroup> getApplicationRoles(List<PermissionGroup> permissionGroups) {
        return permissionGroups.stream()
                .filter(permissionGroup -> {
                    String entityType = permissionGroup.getDefaultDomainType();
                    return entityType != null && entityType.equals(Application.class.getSimpleName());
                })
                .collect(Collectors.toList());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<Boolean> deleteProvisionUser(String userId) {
        return deleteUser(userId);
    }
}
