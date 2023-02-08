package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateGroupMembershipDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.AppsmithComparators;
import com.appsmith.server.helpers.PermissionGroupUtils;
import com.appsmith.server.repositories.UserGroupRepository;
import jakarta.validation.Validator;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.REMOVE_USERS_FROM_USER_GROUPS;
import static com.appsmith.server.constants.FieldName.GROUP_ID;
import static com.appsmith.server.dtos.UsersForGroupDTO.validate;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
public class UserGroupServiceImpl extends BaseService<UserGroupRepository, UserGroup, String> implements UserGroupService {

    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final PolicyGenerator policyGenerator;
    private final PermissionGroupService permissionGroupService;

    private final UserService userService;

    private final ModelMapper modelMapper;
    private final PermissionGroupUtils permissionGroupUtils;

    public UserGroupServiceImpl(Scheduler scheduler,
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
                                PermissionGroupUtils permissionGroupUtils) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.policyGenerator = policyGenerator;
        this.permissionGroupService = permissionGroupService;
        this.userService = userService;
        this.modelMapper = modelMapper;
        this.permissionGroupUtils = permissionGroupUtils;
    }

    @Override
    public Flux<UserGroup> get(MultiValueMap<String, String> params) {
        return this.getAll(READ_USER_GROUPS).sort(AppsmithComparators.userGroupComparator());
    }

    private Flux<UserGroup> getAll(AclPermission aclPermission) {
        return tenantService.getDefaultTenant()
                .flatMapMany(defaultTenantId -> repository.findAllByTenantId(defaultTenantId.getId(), aclPermission));
    }

    @Override
    public Flux<UserGroupCompactDTO> getAllWithAddUserPermission() {
        return this.getAll(ADD_USERS_TO_USER_GROUPS).map(this::generateUserGroupCompactDTO);
    }

    @Override
    public Mono<UserGroupDTO> createGroup(UserGroup userGroup) {
        Mono<Boolean> isCreateAllowedMono = sessionUserService.getCurrentUser()
                .flatMap(user -> tenantService.findById(user.getTenantId(), CREATE_USER_GROUPS))
                .map(tenant -> TRUE)
                .switchIfEmpty(Mono.just(FALSE));

        Mono<UserGroup> userGroupMono = isCreateAllowedMono
                .flatMap(allowed -> !allowed ?
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "create user groups")) :
                        Mono.just(userGroup)
                );

        return Mono.zip(
                        userGroupMono,
                        tenantService.getDefaultTenant()
                )
                .flatMap(tuple -> {
                    UserGroup userGroupWithPolicy = tuple.getT1();
                    Tenant defaultTenant = tuple.getT2();
                    userGroupWithPolicy.setTenantId(defaultTenant.getId());
                    userGroupWithPolicy = generateAndSetUserGroupPolicies(defaultTenant, userGroupWithPolicy);

                    return super.create(userGroupWithPolicy);
                })
                .flatMap(savedUserGroup -> getGroupById(savedUserGroup.getId()));
    }

    @Override
    public Mono<UserGroupDTO> updateGroup(String id, UserGroup resource) {
        return repository.findById(id, MANAGE_USER_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update user groups")))
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
        return repository.findById(id, permission)
                .flatMap(userGroup -> {

                    Mono<List<PermissionGroupInfoDTO>> groupRolesMono = getRoleDTOsForTheGroup(id);
                    Mono<List<UserCompactDTO>> usersMono = getUsersCompactForTheGroup(userGroup);

                    return Mono.zip(groupRolesMono, usersMono)
                            .flatMap(tuple -> {
                                List<PermissionGroupInfoDTO> rolesInfoList = tuple.getT1();
                                List<UserCompactDTO> usersList = tuple.getT2();
                                return generateUserGroupDTO(userGroup, rolesInfoList, usersList);
                            });
                });
    }

    private Mono<UserGroupDTO> generateUserGroupDTO(UserGroup userGroup, List<PermissionGroupInfoDTO> rolesInfoList,
                                                    List<UserCompactDTO> usersList) {

        UserGroupDTO userGroupDTO = new UserGroupDTO();
        modelMapper.map(userGroup, userGroupDTO);
        userGroupDTO.setRoles(rolesInfoList);
        userGroupDTO.setUsers(usersList);
        userGroupDTO.populateTransientFields(userGroup);
        return Mono.just(userGroupDTO);
    }

    private Mono<List<UserCompactDTO>> getUsersCompactForTheGroup(UserGroup userGroup) {
        return userService.findAllByIdsIn(userGroup.getUsers())
                .map(user -> {
                    UserCompactDTO userDTO = new UserCompactDTO();
                    modelMapper.map(user, userDTO);
                    return userDTO;
                })
                .collectList();
    }

    private Mono<List<PermissionGroupInfoDTO>> getRoleDTOsForTheGroup(String userGroupId) {
        return permissionGroupUtils.mapToPermissionGroupInfoDto(permissionGroupService.findAllByAssignedToGroupIdsIn(Set.of(userGroupId)))
                .collectList();
    }

    @Override
    public Mono<List<UserGroupDTO>> inviteUsers(UsersForGroupDTO inviteUsersToGroupDTO, String originHeader) {

        Set<String> ids = inviteUsersToGroupDTO.getGroupIds();
        Set<String> usernames = inviteUsersToGroupDTO.getUsernames();

        return validate(inviteUsersToGroupDTO)
                // Now that we have validated the input, we can start the process of adding users to the group.
                .flatMapMany(bool -> repository.findAllByIds(ids, ADD_USERS_TO_USER_GROUPS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "add users to group")))
                .collectList()
                .flatMap(userGroups -> {

                    Mono<Set<String>> toBeAddedUserIdsMono = Flux.fromIterable(usernames)
                            .flatMap(username -> {
                                User newUser = new User();
                                newUser.setEmail(username.toLowerCase());
                                newUser.setIsEnabled(false);
                                return userService.findByEmail(username)
                                        .switchIfEmpty(userService.userCreate(newUser, false));
                            })
                            .map(User::getId)
                            .collect(Collectors.toSet())
                            .cache();

                    // add the users to the group
                    // TODO : Add handling for sending emails intimating the users about the invite.
                    Flux<UserGroup> updateUsersInGroupsMono = Flux.fromIterable(userGroups)
                            .zipWith(toBeAddedUserIdsMono.repeat())
                            .flatMap(tuple -> {
                                UserGroup userGroup = tuple.getT1();
                                Set<String> userIds = tuple.getT2();
                                userGroup.getUsers().addAll(userIds);
                                return repository.save(userGroup);
                            })
                            .flatMap(userGroup -> {
                                Map<String, Object> eventData = Map.of(FieldName.INVITED_USERS_TO_USER_GROUPS, usernames);
                                return analyticsService.sendObjectEvent(AnalyticsEvents.INVITE_USERS_TO_USER_GROUPS, userGroup, eventData);
                            })
                            .cache();

                    Flux<PermissionGroup> userGroupRolesFlux = permissionGroupService.findAllByAssignedToGroupIdsIn(ids)
                            .cache();

                    // Get roles for the group, and if there are any, then invalidate the cache for the newly added users
                    Mono<Boolean> invalidateCacheOfUsersMono = userGroupRolesFlux
                            .next()
                            .zipWith(toBeAddedUserIdsMono)
                            .flatMap(tuple -> {
                                Set<String> newlyAddedUserIds = tuple.getT2();
                                return permissionGroupService.cleanPermissionGroupCacheForUsers(new ArrayList<>(newlyAddedUserIds));
                            })
                            .thenReturn(TRUE);

                    Mono<List<PermissionGroupInfoDTO>> rolesInfoMono = permissionGroupUtils.mapToPermissionGroupInfoDto(userGroupRolesFlux)
                            .collectList()
                            // In case there are no roles associated with the group, then return an empty list.
                            .switchIfEmpty(Mono.just(new ArrayList<>()));

                    Mono<Map<String, List<UserCompactDTO>>> usersInGroupMapMono = updateUsersInGroupsMono
                            .flatMap(updatedUserGroup ->
                                    getUsersCompactForTheGroup(updatedUserGroup)
                                            .map(usersList -> Tuples.of(updatedUserGroup.getId(), usersList))
                            )
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
    public Mono<List<UserGroupDTO>> removeUsers(UsersForGroupDTO removeUsersFromGroupDTO) {

        Set<String> ids = removeUsersFromGroupDTO.getGroupIds();

        if (CollectionUtils.isEmpty(ids)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, GROUP_ID));
        }

        Set<String> usernames = removeUsersFromGroupDTO.getUsernames();

        return validate(removeUsersFromGroupDTO)
                // Now that we have validated the input, we can start the process of removing users from the group.
                .flatMapMany(bool -> repository.findAllByIds(ids, REMOVE_USERS_FROM_USER_GROUPS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "remove users from group")))
                .collectList()
                .flatMap(userGroups -> {

                    Mono<Set<String>> toBeRemovedUserIdsMono = userService.findAllByUsernameIn(usernames)
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
                                Map<String, Object> eventData = Map.of(FieldName.REMOVED_USERS_FROM_USER_GROUPS, usernames);
                                return analyticsService.sendObjectEvent(AnalyticsEvents.REMOVE_USERS_FROM_USER_GROUPS, userGroup, eventData);
                            })
                            .cache();

                    Flux<PermissionGroup> userGroupRolesFlux = permissionGroupService.findAllByAssignedToGroupIdsIn(ids)
                            .cache();

                    // Get roles for the group, and if there are any, then invalidate the cache for the newly removed users
                    Mono<Boolean> invalidateCacheOfUsersMono = userGroupRolesFlux
                            .next()
                            .zipWith(toBeRemovedUserIdsMono)
                            .flatMap(tuple -> {
                                Set<String> newlyAddedUserIds = tuple.getT2();
                                return permissionGroupService.cleanPermissionGroupCacheForUsers(new ArrayList<>(newlyAddedUserIds));
                            })
                            .thenReturn(TRUE);

                    Mono<List<PermissionGroupInfoDTO>> rolesInfoMono = permissionGroupUtils.mapToPermissionGroupInfoDto(userGroupRolesFlux)
                            .collectList()
                            // In case there are no roles associated with the group, then return an empty list.
                            .switchIfEmpty(Mono.just(new ArrayList<>()));

                    Mono<Map<String, List<UserCompactDTO>>> usersInGroupMapMono = updateUsersInGroupsMono
                            .flatMap(updatedUserGroup ->
                                    getUsersCompactForTheGroup(updatedUserGroup)
                                            .map(usersList -> Tuples.of(updatedUserGroup.getId(), usersList))
                            )
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
        Mono<UserGroup> userGroupMono = repository.findById(id, DELETE_USER_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .cache();

        // Find all permission groups that have this user group assigned to it and update them
        Flux<PermissionGroup> updateAllPermissionGroupsFlux = permissionGroupService.findAllByAssignedToGroupIdsIn(Set.of(id))
                .flatMap(permissionGroup -> {
                    Set<String> assignedToGroupIds = permissionGroup.getAssignedToGroupIds();
                    assignedToGroupIds.remove(id);
                    PermissionGroup updates = new PermissionGroup();
                    updates.setAssignedToGroupIds(assignedToGroupIds);
                    return permissionGroupService.update(permissionGroup.getId(), updates);
                });

        Mono<UserGroup> archiveGroupAndClearCacheMono = userGroupMono
                .flatMap(userGroup -> {
                    List<String> allUsersAffected = userGroup.getUsers()
                            .stream()
                            .collect(Collectors.toList());

                    // Evict the cache entries for all affected users before archiving
                    return permissionGroupService.cleanPermissionGroupCacheForUsers(allUsersAffected)
                            .then(repository.archiveById(id))
                            .then(userGroupMono.flatMap(analyticsService::sendDeleteEvent));
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
    public Mono<List<UserGroupDTO>> changeGroupsForUser(UpdateGroupMembershipDTO updateGroupMembershipDTO, String originHeader) {

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
                .map(tuple -> Stream.concat(
                                tuple.getT1().stream(),
                                tuple.getT2().stream()
                        )
                        .collect(Collectors.toList()));
    }

    @Override
    public Flux<UserGroupCompactDTO> findAllGroupsForUser(String userId) {
        return repository.findAllByUsersIn(Set.of(userId))
                .map(userGroup -> new UserGroupCompactDTO(userGroup.getId(), userGroup.getName()));
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
        return repository.findAllById(groupIds)
                .flatMap(userGroup -> {
                    Set<String> usersInGroup = userGroup.getUsers();
                    usersInGroup.remove(user.getId());

                    Update updateObj = new Update();
                    String path = fieldName(QUserGroup.userGroup.users);

                    updateObj.set(path, usersInGroup);
                    return repository.updateById(userGroup.getId(), updateObj).then(Mono.defer(() -> {
                        Map<String, Object> eventData = Map.of(FieldName.REMOVED_USERS_FROM_USER_GROUPS, Set.of(user.getUsername()));
                        return analyticsService.sendObjectEvent(AnalyticsEvents.REMOVE_USERS_FROM_USER_GROUPS, userGroup, eventData);
                    }));
                })
                .then(Mono.just(TRUE));
    }
}
