package com.appsmith.server.solutions;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.AppsmithComparators;
import com.appsmith.server.helpers.PermissionGroupUtils;
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
    private final PermissionGroupUtils permissionGroupUtils;
    private final EnvManager envManager;
    private final ConfigRepository configRepository;

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
            UserDataRepository userDataRepository,
            PermissionGroupUtils permissionGroupUtils,
            EnvManager envManager,
            ConfigRepository configRepository,
            PermissionGroupPermission permissionGroupPermission,
            EmailService emailService,
            CommonConfig commonConfig) {

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
        this.permissionGroupUtils = permissionGroupUtils;
        this.envManager = envManager;
        this.configRepository = configRepository;
    }

    @Override
    public Mono<List<UserForManagementDTO>> getAllUsers(MultiValueMap<String, String> queryParams) {
        return tenantService
                .getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_READ_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMapMany(tenant -> userRepository
                        .getAllUserObjectsWithEmail(tenant.getId(), queryParams, Optional.of(READ_USERS))
                        .flatMap(userRepository::setUserPermissionsInObject))
                .flatMap(this::addGroupsAndRolesForUser)
                .sort(AppsmithComparators.managementUserComparator())
                .collectList()
                .flatMap(this::addPhotoIdForUsers);
    }

    private Mono<List<UserForManagementDTO>> addPhotoIdForUsers(List<UserForManagementDTO> userForManagementDTOList) {
        List<String> userIds = userForManagementDTOList.stream()
                .map(UserForManagementDTO::getId)
                .toList();
        Mono<Map<String, UserData>> userDataMapMono =
                userDataRepository.findPhotoAssetsByUserIds(userIds).collectMap(UserData::getUserId);

        return Mono.zip(Mono.just(userForManagementDTOList), userDataMapMono).map(pair -> {
            List<UserForManagementDTO> userForManagementDTOList1 = pair.getT1();
            Map<String, UserData> userIdUserDataMap = pair.getT2();
            userForManagementDTOList1.forEach(userForManagementDTO -> {
                String userId = userForManagementDTO.getId();
                if (userIdUserDataMap.containsKey(userId)
                        && StringUtils.hasLength(userIdUserDataMap.get(userId).getProfilePhotoAssetId())) {
                    userForManagementDTO.setPhotoId(
                            userIdUserDataMap.get(userId).getProfilePhotoAssetId());
                }
            });
            return userForManagementDTOList1;
        });
    }

    private Mono<UserForManagementDTO> addPhotoIdForUser(UserForManagementDTO userForManagementDTO) {
        return addPhotoIdForUsers(List.of(userForManagementDTO)).map(userForManagementDTOList -> {
            if (userForManagementDTOList.isEmpty()) {
                return userForManagementDTO;
            }
            return userForManagementDTOList.get(0);
        });
    }

    @Override
    public Mono<UserForManagementDTO> getUserById(String userId) {
        return tenantService
                .getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_READ_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(tenant -> userRepository.findById(userId, READ_USERS))
                // Add the name of the user in response.
                .flatMap(user -> addGroupsAndRolesForUser(user)
                        .flatMap(this::addPhotoIdForUser)
                        .map(dto -> {
                            String name = user.getName();
                            if (StringUtils.hasLength(name)) {
                                dto.setName(name);
                            } else {
                                dto.setName(user.getUsername());
                            }
                            return dto;
                        }));
    }

    private Mono<UserForManagementDTO> addGroupsAndRolesForUser(User user) {
        Flux<PermissionGroupInfoDTO> rolesAssignedToUserFlux = permissionGroupUtils.mapToPermissionGroupInfoDto(
                permissionGroupService.findAllByAssignedToUsersIn(Set.of(user.getId())));
        Flux<UserGroupCompactDTO> groupsForUser = userGroupService.findAllGroupsForUser(user.getId());

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
                            .findAllGroupsForUser(user.getId())
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
    public Mono<Boolean> changeRoleAssociations(UpdateRoleAssociationDTO updateRoleAssociationDTO) {
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
                    .thenMany(rolesToBeAddedFlux);
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
                    });
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

        return Mono.when(isMultipleRolesFromWorkspacePresentMono)
                .then(Mono.when(rolesFromSameWorkspaceExistsInUsersMono, rolesFromSameWorkspaceExistsInUserGroupsMono))
                .then(Mono.when(bulkAssignToRolesFlux.collectList(), bulkUnassignFromRolesFlux.collectList()))
                .then(cleanCacheForUsersMono)
                .then(instanceRoleUpdatedForUsersAndEnvAdminEmailsUpdatedMono);
    }

    @Override
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
    public Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader) {

        Mono<List<User>> inviteIndividualUsersMono = Mono.just(List.of());
        Mono<Boolean> inviteGroupsMono = Mono.just(TRUE);

        List<String> usernames = inviteUsersDTO.getUsernames();
        if (!CollectionUtils.isEmpty(usernames)) {
            inviteIndividualUsersMono = super.inviteUsers(inviteUsersDTO, originHeader);
        }

        Set<String> groups = inviteUsersDTO.getGroups();
        String permissionGroupId = inviteUsersDTO.getPermissionGroupId();

        if (!CollectionUtils.isEmpty(groups)) {
            Set<UserGroupCompactDTO> groupCompactDTOS =
                    groups.stream().map(id -> new UserGroupCompactDTO(id, null)).collect(Collectors.toSet());

            UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
            updateRoleAssociationDTO.setGroups(groupCompactDTOS);
            updateRoleAssociationDTO.setRolesAdded(Set.of(new PermissionGroupCompactDTO(permissionGroupId, null)));

            inviteGroupsMono = this.changeRoleAssociations(updateRoleAssociationDTO);
        }

        Mono<Boolean> finalInviteGroupsMono = inviteGroupsMono;
        // First invite the user and then invite the groups.
        return inviteIndividualUsersMono.flatMap(users -> finalInviteGroupsMono.thenReturn(users));
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

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<Boolean> deleteProvisionUser(String userId) {
        return deleteUser(userId);
    }
}
