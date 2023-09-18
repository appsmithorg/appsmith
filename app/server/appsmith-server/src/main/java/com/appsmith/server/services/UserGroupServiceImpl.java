package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.ProvisionResourceMetadata;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UpdateGroupMembershipDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.enums.ProvisionStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.AppsmithComparators;
import com.appsmith.server.helpers.PermissionGroupUtils;
import com.appsmith.server.helpers.ProvisionUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce_compatible.UserGroupServiceCECompatibleImpl;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.REMOVE_USERS_FROM_USER_GROUPS;
import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;
import static com.appsmith.server.constants.FieldName.EVENT_DATA;
import static com.appsmith.server.constants.FieldName.GROUP_ID;
import static com.appsmith.server.constants.FieldName.IS_PROVISIONED;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_REMOVED_USERS;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_USERS_INVITED;
import static com.appsmith.server.constants.QueryParams.COUNT;
import static com.appsmith.server.constants.QueryParams.FILTER_DELIMITER;
import static com.appsmith.server.constants.QueryParams.GROUP_NAME_FILTER;
import static com.appsmith.server.constants.QueryParams.GROUP_USERID_FILTER;
import static com.appsmith.server.constants.QueryParams.START_INDEX;
import static com.appsmith.server.constants.ce.FieldNameCE.CLOUD_HOSTED_EXTRA_PROPS;
import static com.appsmith.server.dtos.UsersForGroupDTO.validate;
import static com.appsmith.server.enums.ProvisionResourceType.GROUP;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
public class UserGroupServiceImpl extends UserGroupServiceCECompatibleImpl implements UserGroupService {

    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final PolicyGenerator policyGenerator;
    private final PermissionGroupService permissionGroupService;

    private final UserService userService;

    private final ModelMapper modelMapper;
    private final PermissionGroupUtils permissionGroupUtils;
    private final UserDataRepository userDataRepository;
    private final UserUtils userUtils;
    private final PolicySolution policySolution;
    private final UserRepository userRepository;
    private final ProvisionUtils provisionUtils;
    private final EmailService emailService;
    private final ConfigService configService;

    public UserGroupServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            UserGroupRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TenantService tenantService,
            PolicyGenerator policyGenerator,
            PermissionGroupService permissionGroupService,
            UserService userService,
            ModelMapper modelMapper,
            PermissionGroupUtils permissionGroupUtils,
            UserDataRepository userDataRepository,
            UserUtils userUtils,
            PolicySolution policySolution,
            UserRepository userRepository,
            ProvisionUtils provisionUtils,
            EmailService emailService,
            ConfigService configService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.policyGenerator = policyGenerator;
        this.permissionGroupService = permissionGroupService;
        this.userService = userService;
        this.modelMapper = modelMapper;
        this.permissionGroupUtils = permissionGroupUtils;
        this.userDataRepository = userDataRepository;
        this.userUtils = userUtils;
        this.policySolution = policySolution;
        this.userRepository = userRepository;
        this.provisionUtils = provisionUtils;
        this.emailService = emailService;
        this.configService = configService;
    }

    @Override
    public Flux<UserGroup> get(MultiValueMap<String, String> params) {
        return this.getAll(READ_USER_GROUPS, params).sort(AppsmithComparators.userGroupComparator());
    }

    private Flux<UserGroup> getAll(AclPermission aclPermission, MultiValueMap<String, String> queryParams) {
        return tenantService
                .getDefaultTenant()
                .flatMapMany(defaultTenantId ->
                        repository.findAllByTenantId(defaultTenantId.getId(), queryParams, aclPermission));
    }

    @Override
    public Mono<List<UserGroupCompactDTO>> getAllWithAddUserPermission() {
        return this.getAll(ADD_USERS_TO_USER_GROUPS, new LinkedMultiValueMap<>())
                .map(this::generateUserGroupCompactDTO)
                .collectList();
    }

    @Override
    public Mono<List<UserGroupCompactDTO>> getAllReadableGroups() {
        return this.getAll(READ_USER_GROUPS, new LinkedMultiValueMap<>())
                .map(this::generateUserGroupCompactDTO)
                .collectList();
    }

    @Override
    public Mono<UserGroupDTO> createGroup(UserGroup userGroup) {
        return createUserGroup(userGroup).flatMap(savedUserGroup -> getGroupById(savedUserGroup.getId()));
    }

    @Override
    public Mono<UserGroupDTO> updateGroup(String id, UserGroup resource) {
        return repository
                .findById(id, MANAGE_USER_GROUPS)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update user groups")))
                .flatMap(userGroup -> {
                    // The update API should only update the name and description of the group. The fields should not be
                    // updated using this function.
                    userGroup.setName(resource.getName());
                    userGroup.setDescription(resource.getDescription());
                    return super.update(id, userGroup);
                })
                .flatMap(savedUserGroup -> getGroupById(savedUserGroup.getId()));
    }

    @Override
    public Mono<UserGroup> getById(String id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UserGroupDTO> getGroupById(String id) {

        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return this.getGroupDTOById(id, READ_USER_GROUPS);
    }

    private Mono<UserGroupDTO> getGroupDTOById(String id, AclPermission permission) {
        return repository.findById(id, permission).flatMap(userGroup -> {
            Mono<List<PermissionGroupInfoDTO>> groupRolesMono = getRoleDTOsForTheGroup(id);
            Mono<List<UserCompactDTO>> usersMono =
                    getUsersCompactForTheGroup(userGroup).cache();
            Mono<Map<String, UserData>> userIdUserDataMapMono = usersMono.flatMap(users -> {
                List<String> userIds = users.stream().map(UserCompactDTO::getId).toList();
                return userDataRepository.findPhotoAssetsByUserIds(userIds).collectMap(UserData::getUserId);
            });

            return Mono.zip(groupRolesMono, usersMono, userIdUserDataMapMono).flatMap(tuple -> {
                List<PermissionGroupInfoDTO> rolesInfoList = tuple.getT1();
                List<UserCompactDTO> usersList = tuple.getT2();
                Map<String, UserData> userIdUserDataMap = tuple.getT3();
                usersList.forEach(user -> {
                    String userId = user.getId();
                    if (userIdUserDataMap.containsKey(userId)
                            && StringUtils.hasLength(
                                    userIdUserDataMap.get(userId).getProfilePhotoAssetId())) {
                        user.setPhotoId(userIdUserDataMap.get(userId).getProfilePhotoAssetId());
                    }
                });
                return generateUserGroupDTO(userGroup, rolesInfoList, usersList);
            });
        });
    }

    private Mono<UserGroupDTO> generateUserGroupDTO(
            UserGroup userGroup, List<PermissionGroupInfoDTO> rolesInfoList, List<UserCompactDTO> usersList) {

        UserGroupDTO userGroupDTO = new UserGroupDTO();
        modelMapper.map(userGroup, userGroupDTO);
        userGroupDTO.setRoles(rolesInfoList);
        userGroupDTO.setUsers(usersList);
        userGroupDTO.populateTransientFields(userGroup);
        return Mono.just(userGroupDTO);
    }

    private Mono<List<UserCompactDTO>> getUsersCompactForTheGroup(UserGroup userGroup) {
        return userService
                .findAllByIdsIn(userGroup.getUsers())
                .map(user -> {
                    UserCompactDTO userDTO = new UserCompactDTO();
                    modelMapper.map(user, userDTO);
                    return userDTO;
                })
                .collectList();
    }

    private Mono<List<PermissionGroupInfoDTO>> getRoleDTOsForTheGroup(String userGroupId) {
        return permissionGroupUtils
                .mapToPermissionGroupInfoDto(permissionGroupService.findAllByAssignedToGroupIdsIn(Set.of(userGroupId)))
                .collectList();
    }

    @Override
    public Mono<List<UserGroupDTO>> inviteUsers(UsersForGroupDTO inviteUsersToGroupDTO, String originHeader) {

        Set<String> ids = inviteUsersToGroupDTO.getGroupIds();
        Set<String> usernames = inviteUsersToGroupDTO.getUsernames();

        return validate(inviteUsersToGroupDTO)
                // Now that we have validated the input, we can start the process of adding users to the group.
                .flatMapMany(bool -> repository.findAllByIds(ids, ADD_USERS_TO_USER_GROUPS))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "add users to group")))
                .collectList()
                .flatMap(userGroups -> {
                    Flux<User> usersFlux = Flux.fromIterable(usernames).flatMap(username -> {
                        User newUser = new User();
                        newUser.setEmail(username.toLowerCase());
                        newUser.setIsEnabled(false);
                        return userService.findByEmail(username).switchIfEmpty(userService.userCreate(newUser, false));
                    });

                    Mono<Set<String>> toBeAddedUserIdsMono = usersFlux
                            .map(User::getId)
                            .collect(Collectors.toSet())
                            .cache();

                    Mono<User> currentUserMono =
                            sessionUserService.getCurrentUser().cache();

                    Mono<String> instanceIdMono = configService.getInstanceId();

                    Flux<UserGroup> updateUsersInGroupsMono = Flux.fromIterable(userGroups)
                            .zipWith(toBeAddedUserIdsMono.repeat())
                            .flatMap(tuple -> {
                                UserGroup userGroup = tuple.getT1();
                                Set<String> userIds = tuple.getT2();
                                userGroup.getUsers().addAll(userIds);
                                return repository.save(userGroup);
                            })
                            .flatMap(userGroup -> {
                                Map<String, Object> eventData =
                                        Map.of(FieldName.INVITED_USERS_TO_USER_GROUPS, usernames);
                                Map<String, Object> extraPropsForCloudHostedInstance =
                                        Map.of(FieldName.INVITED_USERS_TO_USER_GROUPS, usernames);
                                Map<String, Object> analyticsProperties = Map.of(
                                        NUMBER_OF_USERS_INVITED,
                                        usernames.size(),
                                        EVENT_DATA,
                                        eventData,
                                        CLOUD_HOSTED_EXTRA_PROPS,
                                        extraPropsForCloudHostedInstance,
                                        IS_PROVISIONED,
                                        userGroup.getIsProvisioned());
                                return analyticsService.sendObjectEvent(
                                        AnalyticsEvents.INVITE_USERS_TO_USER_GROUPS, userGroup, analyticsProperties);
                            })
                            .cache();

                    Flux<PermissionGroup> userGroupRolesFlux = permissionGroupService
                            .findAllByAssignedToGroupIdsIn(ids)
                            .cache();

                    // Get roles for the group, and if there are any, then invalidate the cache for the newly added
                    // users
                    Mono<Boolean> invalidateCacheOfUsersMono = userGroupRolesFlux
                            .next()
                            .zipWith(toBeAddedUserIdsMono)
                            .flatMap(tuple -> {
                                Set<String> newlyAddedUserIds = tuple.getT2();
                                return permissionGroupService.cleanPermissionGroupCacheForUsers(
                                        new ArrayList<>(newlyAddedUserIds));
                            })
                            .thenReturn(TRUE);

                    Mono<List<PermissionGroupInfoDTO>> rolesInfoMono = permissionGroupUtils
                            .mapToPermissionGroupInfoDto(userGroupRolesFlux)
                            .collectList()
                            // In case there are no roles associated with the group, then return an empty list.
                            .switchIfEmpty(Mono.just(new ArrayList<>()));

                    Mono<Map<String, List<UserCompactDTO>>> usersInGroupMapMono = updateUsersInGroupsMono
                            .flatMap(updatedUserGroup -> getUsersCompactForTheGroup(updatedUserGroup)
                                    .map(usersList -> Tuples.of(updatedUserGroup.getId(), usersList)))
                            .collectMap(tuple -> tuple.getT1(), tuple -> tuple.getT2());

                    Mono<Tenant> tenantConfigMono = tenantService.getTenantConfiguration();

                    return Mono.zip(invalidateCacheOfUsersMono, rolesInfoMono, usersInGroupMapMono, tenantConfigMono)
                            .flatMap(tuple -> {
                                List<PermissionGroupInfoDTO> rolesInfoList = tuple.getT2();
                                Map<String, List<UserCompactDTO>> usersInGroupMap = tuple.getT3();
                                String instanceName =
                                        tuple.getT4().getTenantConfiguration().getInstanceName();

                                return Flux.fromIterable(userGroups)
                                        .flatMap(userGroup -> {
                                            List<UserCompactDTO> usersList = usersInGroupMap.get(userGroup.getId());
                                            return generateUserGroupDTO(userGroup, rolesInfoList, usersList);
                                        })
                                        .collectList()
                                        .flatMap(userGroupDTOS -> sendUserInvitationEmails(
                                                        currentUserMono,
                                                        usersFlux.collectList(),
                                                        userGroups,
                                                        instanceName,
                                                        originHeader)
                                                .thenReturn(userGroupDTOS));
                            });
                });
    }

    @Override
    public Mono<List<UserGroupDTO>> removeUsers(UsersForGroupDTO removeUsersFromGroupDTO) {

        Set<String> ids = removeUsersFromGroupDTO.getGroupIds();

        if (CollectionUtils.isEmpty(ids)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, GROUP_ID));
        }

        Set<String> usernames = removeUsersFromGroupDTO.getUsernames();

        return validate(removeUsersFromGroupDTO)
                // Now that we have validated the input, we can start the process of removing users from the group.
                .flatMapMany(bool -> repository.findAllByIds(ids, REMOVE_USERS_FROM_USER_GROUPS))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "remove users from group")))
                .collectList()
                .flatMap(userGroups -> {
                    Mono<Set<String>> toBeRemovedUserIdsMono = userService
                            .findAllByUsernameIn(usernames)
                            .map(User::getId)
                            .collect(Collectors.toSet())
                            .cache();

                    // remove the users from the group
                    Flux<UserGroup> updateUsersInGroupsMono = Flux.fromIterable(userGroups)
                            .zipWith(toBeRemovedUserIdsMono.repeat())
                            .flatMap(tuple -> {
                                UserGroup userGroup = tuple.getT1();
                                Set<String> userIds = tuple.getT2();
                                userGroup.getUsers().removeAll(userIds);
                                return repository.save(userGroup);
                            })
                            .flatMap(userGroup -> {
                                Map<String, Object> eventData =
                                        Map.of(FieldName.REMOVED_USERS_FROM_USER_GROUPS, usernames);
                                Map<String, Object> extraPropsForCloudHostedInstance =
                                        Map.of(FieldName.REMOVED_USERS_FROM_USER_GROUPS, usernames);
                                Map<String, Object> analyticsProperties = Map.of(
                                        NUMBER_OF_REMOVED_USERS,
                                        usernames.size(),
                                        EVENT_DATA,
                                        eventData,
                                        CLOUD_HOSTED_EXTRA_PROPS,
                                        extraPropsForCloudHostedInstance,
                                        IS_PROVISIONED,
                                        userGroup.getIsProvisioned());
                                return analyticsService.sendObjectEvent(
                                        AnalyticsEvents.REMOVE_USERS_FROM_USER_GROUPS, userGroup, analyticsProperties);
                            })
                            .cache();

                    Flux<PermissionGroup> userGroupRolesFlux = permissionGroupService
                            .findAllByAssignedToGroupIdsIn(ids)
                            .cache();

                    // Get roles for the group, and if there are any, then invalidate the cache for the newly removed
                    // users
                    Mono<Boolean> invalidateCacheOfUsersMono = userGroupRolesFlux
                            .next()
                            .zipWith(toBeRemovedUserIdsMono)
                            .flatMap(tuple -> {
                                Set<String> newlyAddedUserIds = tuple.getT2();
                                return permissionGroupService.cleanPermissionGroupCacheForUsers(
                                        new ArrayList<>(newlyAddedUserIds));
                            })
                            .thenReturn(TRUE);

                    Mono<List<PermissionGroupInfoDTO>> rolesInfoMono = permissionGroupUtils
                            .mapToPermissionGroupInfoDto(userGroupRolesFlux)
                            .collectList()
                            // In case there are no roles associated with the group, then return an empty list.
                            .switchIfEmpty(Mono.just(new ArrayList<>()));

                    Mono<Map<String, List<UserCompactDTO>>> usersInGroupMapMono = updateUsersInGroupsMono
                            .flatMap(updatedUserGroup -> getUsersCompactForTheGroup(updatedUserGroup)
                                    .map(usersList -> Tuples.of(updatedUserGroup.getId(), usersList)))
                            .collectMap(tuple -> tuple.getT1(), tuple -> tuple.getT2());

                    return Mono.zip(invalidateCacheOfUsersMono, rolesInfoMono, usersInGroupMapMono)
                            .flatMap(tuple -> {
                                List<PermissionGroupInfoDTO> rolesInfoList = tuple.getT2();
                                Map<String, List<UserCompactDTO>> usersInGroupMap = tuple.getT3();
                                return Flux.fromIterable(userGroups)
                                        .flatMap(userGroup -> {
                                            List<UserCompactDTO> usersList = usersInGroupMap.get(userGroup.getId());
                                            return generateUserGroupDTO(userGroup, rolesInfoList, usersList);
                                        })
                                        .collectList();
                            });
                });
    }

    @Override
    public Mono<UserGroup> archiveById(String id) {
        Mono<UserGroup> userGroupMono = repository
                .findById(id, DELETE_USER_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .cache();

        // Find all permission groups that have this user group assigned to it and update them
        Flux<PermissionGroup> updateAllPermissionGroupsFlux = permissionGroupService
                .findAllByAssignedToGroupIdsIn(Set.of(id))
                .flatMap(permissionGroup -> {
                    Set<String> assignedToGroupIds = permissionGroup.getAssignedToGroupIds();
                    assignedToGroupIds.remove(id);
                    PermissionGroup updates = new PermissionGroup();
                    updates.setAssignedToGroupIds(assignedToGroupIds);
                    return permissionGroupService.update(permissionGroup.getId(), updates);
                });

        Mono<UserGroup> archiveGroupAndClearCacheMono = userGroupMono.flatMap(userGroup -> {
            List<String> allUsersAffected = userGroup.getUsers().stream().collect(Collectors.toList());

            // Evict the cache entries for all affected users before archiving
            return permissionGroupService
                    .cleanPermissionGroupCacheForUsers(allUsersAffected)
                    .then(repository.archiveById(id))
                    .then(userGroupMono.flatMap(userGroup1 ->
                            analyticsService.sendDeleteEvent(userGroup1, getAnalyticsProperties(userGroup1))));
        });

        // First update all the permission groups that have this user group assigned to it
        return updateAllPermissionGroupsFlux
                // then clear cache for all affected users and archive the user group
                .then(archiveGroupAndClearCacheMono)
                // return the deleted group
                .then(userGroupMono);
    }

    private UserGroup generateAndSetUserGroupPolicies(Tenant tenant, UserGroup userGroup) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, UserGroup.class);
        userGroup.setPolicies(policies);
        return userGroup;
    }

    @Override
    public Mono<UserGroup> findById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    public Mono<List<UserGroupDTO>> changeGroupsForUser(
            UpdateGroupMembershipDTO updateGroupMembershipDTO, String originHeader) {

        Set<String> groupIdsAdded = updateGroupMembershipDTO.getGroupsAdded();
        Set<String> groupIdsRemoved = updateGroupMembershipDTO.getGroupsRemoved();
        Set<String> usernames = updateGroupMembershipDTO.getUsernames();

        Mono<List<UserGroupDTO>> userAddedMono = Mono.just(List.of());
        Mono<List<UserGroupDTO>> userRemovedMono = Mono.just(List.of());

        if (!CollectionUtils.isEmpty(groupIdsAdded)) {
            UsersForGroupDTO addUsersDTO = new UsersForGroupDTO();
            addUsersDTO.setUsernames(usernames);
            addUsersDTO.setGroupIds(groupIdsAdded);
            userAddedMono = inviteUsers(addUsersDTO, originHeader);
        }
        if (!CollectionUtils.isEmpty(groupIdsRemoved)) {
            UsersForGroupDTO removeUsersDTO = new UsersForGroupDTO();
            removeUsersDTO.setUsernames(usernames);
            removeUsersDTO.setGroupIds(groupIdsRemoved);
            userRemovedMono = removeUsers(removeUsersDTO);
        }

        return Mono.zip(userAddedMono, userRemovedMono)
                .map(tuple -> Stream.concat(tuple.getT1().stream(), tuple.getT2().stream())
                        .collect(Collectors.toList()));
    }

    @Override
    public Flux<UserGroupCompactDTO> findAllGroupsForUser(String userId) {
        return repository
                .findAllByUsersIn(Set.of(userId), READ_USER_GROUPS)
                .map(userGroup -> new UserGroupCompactDTO(
                        userGroup.getId(),
                        userGroup.getName(),
                        userGroup.getUserPermissions(),
                        userGroup.getIsProvisioned()));
    }

    private UserGroupCompactDTO generateUserGroupCompactDTO(UserGroup userGroup) {
        if (userGroup == null) {
            throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "user group can't be null");
        }
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(userGroup.getId());
        userGroupCompactDTO.setName(userGroup.getName());
        return userGroupCompactDTO;
    }

    @Override
    public Mono<Boolean> bulkRemoveUserFromGroupsWithoutPermission(User user, Set<String> groupIds) {
        return repository
                .findAllById(groupIds)
                .flatMap(userGroup -> {
                    Set<String> usersInGroup = userGroup.getUsers();
                    usersInGroup.remove(user.getId());

                    Update updateObj = new Update();
                    String path = fieldName(QUserGroup.userGroup.users);

                    updateObj.set(path, usersInGroup);
                    return repository.updateById(userGroup.getId(), updateObj).then(Mono.defer(() -> {
                        Map<String, Object> eventData =
                                Map.of(FieldName.REMOVED_USERS_FROM_USER_GROUPS, Set.of(user.getUsername()));
                        Map<String, Object> extraPropsForCloudHostedInstance =
                                Map.of(FieldName.REMOVED_USERS_FROM_USER_GROUPS, Set.of(user.getUsername()));
                        Map<String, Object> analyticsProperties = Map.of(
                                NUMBER_OF_REMOVED_USERS,
                                1,
                                EVENT_DATA,
                                eventData,
                                CLOUD_HOSTED_EXTRA_PROPS,
                                extraPropsForCloudHostedInstance,
                                IS_PROVISIONED,
                                userGroup.getIsProvisioned());
                        return analyticsService.sendObjectEvent(
                                AnalyticsEvents.REMOVE_USERS_FROM_USER_GROUPS, userGroup, analyticsProperties);
                    }));
                })
                .then(Mono.just(TRUE));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionResourceDto> updateProvisionGroup(String id, UserGroupUpdateDTO resource) {
        return repository
                .findById(id, MANAGE_USER_GROUPS)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update user groups")))
                .flatMap(userGroup -> {
                    Tuple2<Boolean, Mono<Long>> updateUserGroupNameAndDescriptionPair =
                            checkAndUpdateNameAndDescriptionForUserGroup(resource, userGroup);
                    Tuple2<Boolean, Mono<Long>> inviteUsersToUserGroupPair =
                            checkAndInviteUsersToUserGroup(resource, userGroup);
                    Tuple2<Boolean, Mono<Long>> removeUsersFromUserGroupPair =
                            checkAndRemoveUsersFromUserGroup(resource, userGroup);
                    Mono<UserGroup> updatedUserGroupMono = Mono.just(userGroup);

                    // This boolean condition will check whether the userGroup was updated or not
                    // and then based on that get the updatedUserGroup from the repository
                    boolean updatedNameOrDescription = updateUserGroupNameAndDescriptionPair.getT1();
                    boolean invitedUsersToGroup = inviteUsersToUserGroupPair.getT1();
                    boolean removedUsersFromGroup = removeUsersFromUserGroupPair.getT1();
                    if (updatedNameOrDescription || invitedUsersToGroup || removedUsersFromGroup) {
                        updatedUserGroupMono = repository.findById(id);
                    }

                    // Cannot invoke the Publishers from inviteUsersToUserGroupPair & removeUsersFromUserGroupPair in
                    // parallel because both of them will update the same field "users" in the same document, and this
                    // could lead to a race condition.
                    Mono<Long> inviteUsersToUserGroupMono = inviteUsersToUserGroupPair.getT2();
                    Mono<Long> removeUsersFromUserGroupMono = removeUsersFromUserGroupPair.getT2();
                    Mono<Long> updateUserGroupNameAndDescriptionMono = updateUserGroupNameAndDescriptionPair.getT2();
                    Mono<Long> usersInvitedAndThenRemoved =
                            inviteUsersToUserGroupMono.then(removeUsersFromUserGroupMono);

                    return updateUserGroupNameAndDescriptionMono
                            .then(usersInvitedAndThenRemoved)
                            .then(updatedUserGroupMono);
                })
                .flatMap(this::updateProvisioningStatus)
                .map(this::getProvisionResourceDto);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionResourceDto> getProvisionGroup(String groupId) {
        return repository
                .findById(groupId, READ_USER_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Group", groupId)))
                .flatMap(this::updateProvisioningStatus)
                .map(this::getProvisionResourceDto);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<PagedDomain<ProvisionResourceDto>> getProvisionGroups(MultiValueMap<String, String> queryParams) {
        int count = NO_RECORD_LIMIT;
        int startIndex = 0;
        List<String> groupNames = List.of();
        List<String> groupMembers = List.of();

        if (org.apache.commons.lang3.StringUtils.isNotEmpty(queryParams.getFirst(COUNT))) {
            count = Integer.parseInt(queryParams.getFirst(COUNT));
        }
        if (org.apache.commons.lang3.StringUtils.isNotEmpty(queryParams.getFirst(START_INDEX))) {
            startIndex = Integer.parseInt(queryParams.getFirst(START_INDEX));
        }
        if (org.apache.commons.lang3.StringUtils.isNotEmpty(queryParams.getFirst(GROUP_NAME_FILTER))) {
            groupNames = Arrays.stream(queryParams.getFirst(GROUP_NAME_FILTER).split(FILTER_DELIMITER))
                    .toList();
        }

        if (org.apache.commons.lang3.StringUtils.isNotEmpty(queryParams.getFirst(GROUP_USERID_FILTER))) {
            groupMembers = Arrays.stream(
                            queryParams.getFirst(GROUP_USERID_FILTER).split(FILTER_DELIMITER))
                    .toList();
        }

        return repository
                .findUserGroupsWithParamsPaginated(
                        count, startIndex, groupNames, groupMembers, Optional.of(READ_USER_GROUPS))
                .map(pagedUserGroups -> {
                    List<ProvisionResourceDto> provisionedUsersDto = pagedUserGroups.getContent().stream()
                            .map(this::getProvisionResourceDto)
                            .toList();
                    return PagedDomain.<ProvisionResourceDto>builder()
                            .total(pagedUserGroups.getTotal())
                            .count(pagedUserGroups.getCount())
                            .startIndex(pagedUserGroups.getStartIndex())
                            .content(provisionedUsersDto)
                            .build();
                })
                .zipWith(provisionUtils.updateProvisioningStatusAndLastUpdatedAt(ProvisionStatus.ACTIVE))
                .map(pair -> {
                    PagedDomain<ProvisionResourceDto> pagedGroups = pair.getT1();
                    Boolean updateProvisioningStatus = pair.getT2();
                    return pagedGroups;
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionResourceDto> createProvisionGroup(UserGroup userGroup) {
        // Note:
        // Have moved the setting of Provision Flag from the method updateProvisionUserGroupPolicies to this function
        // so that correct data about the ProvisionFlag can be sent to Analytics Event, when sending the usergroup
        // create event.
        userGroup.setIsProvisioned(Boolean.TRUE);
        return createUserGroup(userGroup)
                .flatMap(this::updateProvisionUserGroupPolicies)
                .flatMap(this::updateProvisioningStatus)
                .map(this::getProvisionResourceDto);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<List<UserGroupDTO>> removeUsersFromProvisionGroup(UsersForGroupDTO removeUsersFromGroupDTO) {
        List<String> userIds = removeUsersFromGroupDTO.getUserIds();
        return tenantService
                .getDefaultTenantId()
                .flatMap(tenantId -> userRepository
                        .getUserEmailsByIdsAndTenantId(userIds, tenantId, Optional.empty())
                        .collect(Collectors.toSet())
                        .flatMap(userEmails -> {
                            if (CollectionUtils.isEmpty(userEmails)) {
                                return Mono.just(new ArrayList<UserGroupDTO>());
                            }
                            UsersForGroupDTO userEmailsFromGroupDTO = new UsersForGroupDTO();
                            userEmailsFromGroupDTO.setUsernames(userEmails);
                            userEmailsFromGroupDTO.setGroupIds(removeUsersFromGroupDTO.getGroupIds());
                            return this.removeUsers(userEmailsFromGroupDTO);
                        }))
                .zipWith(provisionUtils.updateProvisioningStatusAndLastUpdatedAt(ProvisionStatus.ACTIVE))
                .map(pair -> {
                    List<UserGroupDTO> userGroupDTOs = pair.getT1();
                    Boolean provisioningStatusUpdate = pair.getT2();
                    return userGroupDTOs;
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<List<UserGroupDTO>> addUsersToProvisionGroup(UsersForGroupDTO addUsersFromGroupDTO) {
        List<String> userIds = addUsersFromGroupDTO.getUserIds();
        return tenantService
                .getDefaultTenantId()
                .flatMap(tenantId -> userRepository
                        .getUserEmailsByIdsAndTenantId(userIds, tenantId, Optional.empty())
                        .collect(Collectors.toSet())
                        .flatMap(userEmails -> {
                            if (CollectionUtils.isEmpty(userEmails)) {
                                return Mono.just(new ArrayList<UserGroupDTO>());
                            }
                            UsersForGroupDTO userEmailsFromGroupDTO = new UsersForGroupDTO();
                            userEmailsFromGroupDTO.setUsernames(userEmails);
                            userEmailsFromGroupDTO.setGroupIds(addUsersFromGroupDTO.getGroupIds());
                            return this.inviteUsers(userEmailsFromGroupDTO, null);
                        }))
                .zipWith(provisionUtils.updateProvisioningStatusAndLastUpdatedAt(ProvisionStatus.ACTIVE))
                .map(pair -> {
                    List<UserGroupDTO> userGroupDTOs = pair.getT1();
                    Boolean provisioningStatusUpdate = pair.getT2();
                    return userGroupDTOs;
                });
    }

    private ProvisionResourceDto getProvisionResourceDto(UserGroup userGroup) {
        ProvisionResourceMetadata metadata = ProvisionResourceMetadata.builder()
                .created(userGroup.getCreatedAt().toString())
                .lastModified(userGroup.getUpdatedAt().toString())
                .resourceType(GROUP.getValue())
                .build();
        return ProvisionResourceDto.builder()
                .resource(userGroup)
                .metadata(metadata)
                .build();
    }

    private Mono<UserGroup> updateProvisioningStatus(UserGroup userGroup) {
        return provisionUtils
                .updateProvisioningStatusAndLastUpdatedAt(ProvisionStatus.ACTIVE)
                .thenReturn(userGroup);
    }

    /**
     * The method edits the existing permissions on the User group resource for Manage, Delete, Invite users to & Remove users from User group permissions.
     * It removes the existing Manage, Delete, Invite users and Remove users permissions for the user group,
     * so that Instance Admin is not able to edit, delete, invite users to or remove users from the User group.
     * It then gives the above-mentioned permissions for the user group to Provision Role, so that the user group can be managed by it.
     * @param userGroup
     * @return
     */
    private Mono<UserGroup> updateProvisionUserGroupPolicies(UserGroup userGroup) {
        return userUtils.getProvisioningRole().flatMap(provisioningRole -> {
            Set<Policy> currentUserPolicies = userGroup.getPolicies();
            Set<Policy> userGroupPoliciesWithReadUserGroup = currentUserPolicies.stream()
                    .filter(policy -> policy.getPermission().equals(READ_USER_GROUPS.getValue()))
                    .collect(Collectors.toSet());
            userGroup.setPolicies(userGroupPoliciesWithReadUserGroup);
            Map<String, Policy> newManageUserGroupPolicy =
                    policySolution.generatePolicyFromPermissionWithPermissionGroup(
                            MANAGE_USER_GROUPS, provisioningRole.getId());
            Map<String, Policy> newDeleteUserGroupPolicy =
                    policySolution.generatePolicyFromPermissionWithPermissionGroup(
                            DELETE_USER_GROUPS, provisioningRole.getId());
            policySolution.addPoliciesToExistingObject(newManageUserGroupPolicy, userGroup);
            policySolution.addPoliciesToExistingObject(newDeleteUserGroupPolicy, userGroup);
            return repository.save(userGroup);
        });
    }

    private Mono<UserGroup> createUserGroup(UserGroup userGroup) {
        Mono<Boolean> isCreateAllowedMono = sessionUserService
                .getCurrentUser()
                .flatMap(user -> tenantService.findById(user.getTenantId(), CREATE_USER_GROUPS))
                .map(tenant -> TRUE)
                .switchIfEmpty(Mono.just(FALSE));

        Mono<UserGroup> userGroupMono = isCreateAllowedMono.flatMap(allowed -> !allowed
                ? Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "create user groups"))
                : Mono.just(userGroup));

        return Mono.zip(userGroupMono, tenantService.getDefaultTenant()).flatMap(tuple -> {
            UserGroup userGroupWithPolicy = tuple.getT1();
            Tenant defaultTenant = tuple.getT2();
            userGroupWithPolicy.setTenantId(defaultTenant.getId());
            userGroupWithPolicy = generateAndSetUserGroupPolicies(defaultTenant, userGroupWithPolicy);

            return super.create(userGroupWithPolicy);
        });
    }

    /**
     * The method cross-checks the resource which contains the update information against the actual existingUserGroup.
     * If the name or description haven't been renamed, then it doesn't actually update the existingUserGroup, else
     * it will update the existingUserGroup with the updated received in resource.
     * @param resource
     * @param existingUserGroup
     * @return
     */
    private Tuple2<Boolean, Mono<Long>> checkAndUpdateNameAndDescriptionForUserGroup(
            UserGroupUpdateDTO resource, UserGroup existingUserGroup) {
        Mono<Long> updateUserGroupNameAndDescriptionMono = Mono.just(1L);
        boolean willUpdateGroupNameAndDescription = false;
        if (Objects.nonNull(resource.getName()) || Objects.nonNull(resource.getDescription())) {
            boolean groupNameUpdated =
                    Objects.nonNull(resource.getName()) && !resource.getName().equals(existingUserGroup.getName());
            boolean groupDescriptionUpdated = Objects.nonNull(resource.getDescription())
                    && !resource.getDescription().equals(existingUserGroup.getDescription());

            if (groupNameUpdated) {
                existingUserGroup.setName(resource.getName());
            }

            if (groupDescriptionUpdated) {
                existingUserGroup.setDescription(resource.getDescription());
            }

            if (groupNameUpdated || groupDescriptionUpdated) {
                updateUserGroupNameAndDescriptionMono = super.update(existingUserGroup.getId(), existingUserGroup)
                        .thenReturn(1L);
                willUpdateGroupNameAndDescription = true;
            }
        }
        return Tuples.of(willUpdateGroupNameAndDescription, updateUserGroupNameAndDescriptionMono);
    }

    /**
     * The method cross-checks the resource which contains the update information against the actual existingUserGroup.
     * If there are no new users who have been invited, then we don't invoke the `addUsersToProvisionGroup` method, else
     * we invite the new users to the existingUserGroup.
     * @param resource
     * @param userGroup
     * @return
     */
    private Tuple2<Boolean, Mono<Long>> checkAndInviteUsersToUserGroup(
            UserGroupUpdateDTO resource, UserGroup userGroup) {
        Mono<Long> inviteUsersToUserGroupMono = Mono.just(1L);
        boolean willInviteUsersToUserGroup = false;

        if (Objects.nonNull(resource.getUsers())) {
            Set<String> requestedUsersInGroup = new HashSet<>(resource.getUsers());
            Set<String> currentUsersInGroup = new HashSet<>(userGroup.getUsers());

            Set<String> usersToInviteToGroup = new HashSet<>(requestedUsersInGroup);
            usersToInviteToGroup.removeAll(currentUsersInGroup);

            if (!usersToInviteToGroup.isEmpty()) {
                UsersForGroupDTO inviteUsersToProvisionGroupDTO = new UsersForGroupDTO();
                inviteUsersToProvisionGroupDTO.setGroupIds(Set.of(userGroup.getId()));
                inviteUsersToProvisionGroupDTO.setUserIds(
                        usersToInviteToGroup.stream().toList());
                inviteUsersToUserGroupMono =
                        addUsersToProvisionGroup(inviteUsersToProvisionGroupDTO).thenReturn(1L);
                willInviteUsersToUserGroup = true;
            }
        }
        return Tuples.of(willInviteUsersToUserGroup, inviteUsersToUserGroupMono);
    }

    /**
     * The method cross-checks the resource which contains the update information against the actual existingUserGroup.
     * If there are no users who have been removed, then we don't invoke the `removeUsersFromProvisionGroup` method, else
     * we remove  new users from the existingUserGroup.
     * @param resource
     * @param userGroup
     * @return
     */
    private Tuple2<Boolean, Mono<Long>> checkAndRemoveUsersFromUserGroup(
            UserGroupUpdateDTO resource, UserGroup userGroup) {
        Mono<Long> removeUsersFromUserGroupMono = Mono.just(1L);
        boolean willRemoveUsersFromUserGroup = false;

        if (Objects.nonNull(resource.getUsers())) {
            Set<String> requestedUsersInGroup = new HashSet<>(resource.getUsers());
            Set<String> currentUsersInGroup = new HashSet<>(userGroup.getUsers());

            Set<String> usersToRemoveFromGroup = new HashSet<>(currentUsersInGroup);
            usersToRemoveFromGroup.removeAll(requestedUsersInGroup);

            if (!usersToRemoveFromGroup.isEmpty()) {
                UsersForGroupDTO removeUsersFromProvisionGroupDTO = new UsersForGroupDTO();
                removeUsersFromProvisionGroupDTO.setGroupIds(Set.of(userGroup.getId()));
                removeUsersFromProvisionGroupDTO.setUserIds(
                        usersToRemoveFromGroup.stream().toList());
                removeUsersFromUserGroupMono = removeUsersFromProvisionGroup(removeUsersFromProvisionGroupDTO)
                        .thenReturn(1L);
                willRemoveUsersFromUserGroup = true;
            }
        }
        return Tuples.of(willRemoveUsersFromUserGroup, removeUsersFromUserGroupMono);
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(UserGroup savedResource) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put(FieldName.IS_PROVISIONED, savedResource.getIsProvisioned());
        return analyticsProperties;
    }

    private Mono<Void> sendUserInvitationEmails(
            Mono<User> invitingUser,
            Mono<List<User>> invitedUsers,
            List<UserGroup> groupsAddedTo,
            String instanceName,
            String originHeader) {

        return Mono.zip(invitingUser, invitedUsers).flatMap(tuple -> {
            User inviter = tuple.getT1();
            List<User> invitedUserList = tuple.getT2();

            return Flux.fromIterable(invitedUserList)
                    .flatMap(invitedUser -> Flux.fromIterable(groupsAddedTo)
                            .flatMap(group -> emailService.sendInviteUserToInstanceEmailViaGroupInvite(
                                    inviter, invitedUser, group.getName(), instanceName, originHeader))
                            .then())
                    .then();
        });
    }

    // TODO
    //  Remove this method and start using then archiveById once we have the ability to use multiple feature flags.
    //  In this case, it is going to be an OR of license_scim_enabled & GAC feature flag.
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<UserGroup> archiveProvisionGroupById(String id) {
        return archiveById(id);
    }
}
