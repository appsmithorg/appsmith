package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static java.lang.Boolean.TRUE;

@Component
@Slf4j
public class UserManagementServiceImpl implements UserManagementService {
    private final UserGroupService userGroupService;
    private final PermissionGroupService permissionGroupService;
    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final UserGroupRepository userGroupRepository;


    public UserManagementServiceImpl(UserGroupService userGroupService,
                                     PermissionGroupService permissionGroupService,
                                     TenantService tenantService,
                                     UserRepository userRepository,
                                     UserService userService,
                                     PermissionGroupRepository permissionGroupRepository,
                                     UserGroupRepository userGroupRepository) {

        this.userGroupService = userGroupService;
        this.permissionGroupService = permissionGroupService;
        this.tenantService = tenantService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.permissionGroupRepository = permissionGroupRepository;
        this.userGroupRepository = userGroupRepository;
    }

    @Override
    public Mono<List<UserForManagementDTO>> getAllUsers() {
        return tenantService.getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_MANAGE_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMapMany(tenant -> {
                    return userRepository.getAllUserObjectsWithEmail(tenant.getId());
                })
                // Remove the auto generated anonymous user from this list
                .filter(user -> !user.getEmail().equals(ANONYMOUS_USER))
                .flatMap(this::addGroupsAndRolesForUser)
                .collectList();
    }

    @Override
    public Mono<UserForManagementDTO> getUserById(String userId) {
        return tenantService.getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_MANAGE_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(tenant -> userRepository.findById(userId))
                // Add the name of the user in response.
                .flatMap(user -> addGroupsAndRolesForUser(user)
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
        Flux<PermissionGroupInfoDTO> rolesAssignedToUserFlux =
                permissionGroupService.findAllByAssignedToUsersIn(Set.of(user.getId()))
                        .map(permissionGroup -> new PermissionGroupInfoDTO(permissionGroup.getId(), permissionGroup.getName()));
        Flux<UserGroupCompactDTO> groupsForUser = userGroupService.findAllGroupsForUser(user.getId());

        return Mono.zip(
                        rolesAssignedToUserFlux.collectList(),
                        groupsForUser.collectList()
                )
                .map(tuple -> {
                    List<PermissionGroupInfoDTO> rolesInfo = tuple.getT1();
                    List<UserGroupCompactDTO> groupsInfo = tuple.getT2();

                    return new UserForManagementDTO(user.getId(), user.getUsername(), groupsInfo, rolesInfo);
                });
    }

    @Override
    public Mono<Boolean> deleteUser(String userId) {

        return tenantService.getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_MANAGE_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(tenant -> userRepository.findById(userId))
                .flatMap(user -> {
                    Mono<Set<String>> permissionGroupIdsMono = permissionGroupService.findAllByAssignedToUsersIn(Set.of(user.getId()))
                            .map(PermissionGroup::getId)
                            .collect(Collectors.toSet());
                    Mono<Set<String>> groupIdsMono = userGroupService.findAllGroupsForUser(user.getId())
                            .map(UserGroupCompactDTO::getId)
                            .collect(Collectors.toSet());

                    Mono<Boolean> unassignedFromRolesMono = permissionGroupIdsMono
                            .flatMap(permissionGroupIds -> permissionGroupService.bulkUnassignUserFromPermissionGroupsWithoutPermission(userId, permissionGroupIds));

                    Mono<Boolean> removedFromGroupsMono = groupIdsMono
                            .flatMap(groupIds -> userGroupService.bulkRemoveUserFromGroupsWithoutPermission(userId, groupIds));

                    Mono<Void> cleanPermissionGroupCacheMono = permissionGroupService.cleanPermissionGroupCacheForUsers(List.of(user.getId()));

                    Mono<Boolean> archiveUserMono = userRepository.archiveById(userId);

                    return Mono.zip(unassignedFromRolesMono, removedFromGroupsMono)
                            .then(archiveUserMono)
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

        Flux<User> userFlux = Flux.empty();
        Flux<UserGroup> groupFlux = Flux.empty();
        Flux<PermissionGroup> rolesAddedFlux = Flux.empty();
        Flux<PermissionGroup> rolesRemovedFlux = Flux.empty();

        if (!CollectionUtils.isEmpty(userDTOs)) {
            userFlux = Flux.fromIterable(userDTOs.stream().map(UserCompactDTO::getUsername).collect(Collectors.toSet()))
                    .flatMap(username -> {
                        User newUser = new User();
                        newUser.setEmail(username.toLowerCase());
                        newUser.setIsEnabled(false);
                        return userService.findByEmail(username)
                                .switchIfEmpty(userService.userCreate(newUser, false));
                    });

        }
        if (!CollectionUtils.isEmpty(groupDTOs)) {
            groupFlux = userGroupRepository.findAllById(groupDTOs.stream().map(UserGroupCompactDTO::getId).collect(Collectors.toSet()))
                    .cache();
        }
        if (!CollectionUtils.isEmpty(rolesAddedDTOs)) {
            rolesAddedFlux = permissionGroupRepository.findAllById(rolesAddedDTOs.stream().map(PermissionGroupCompactDTO::getId).collect(Collectors.toSet()),
                    ASSIGN_PERMISSION_GROUPS);
        }
        if (!CollectionUtils.isEmpty(rolesRemovedDTOs)) {
            rolesRemovedFlux = permissionGroupRepository.findAllById(rolesRemovedDTOs.stream().map(PermissionGroupCompactDTO::getId).collect(Collectors.toSet()),
                    UNASSIGN_PERMISSION_GROUPS);
        }

        // Bulk assign to roles added
        Flux<PermissionGroup> bulkAssignToRolesMono = Flux.zip(rolesAddedFlux, userFlux.collectList().repeat(), groupFlux.collectList().repeat())
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();
                    return bulkAssignToUsersAndGroups(permissionGroup, users, groups);
                });

        // Bulk unassign from roles removed
        Flux<PermissionGroup> bulkUnassignFromRolesMono = Flux.zip(rolesRemovedFlux, userFlux.collectList().repeat(), groupFlux.collectList().repeat())
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

        return Mono.when(bulkAssignToRolesMono.collectList(), bulkUnassignFromRolesMono.collectList())
                .then(cleanCacheForUsersMono)
                .thenReturn(TRUE);

    }

    private Mono<PermissionGroup> bulkAssignToUsersAndGroups(PermissionGroup permissionGroup, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(permissionGroup);
        ensureAssignedToUserGroups(permissionGroup);

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toList());
        permissionGroup.getAssignedToUserIds().addAll(userIds);
        permissionGroup.getAssignedToGroupIds().addAll(groupIds);
        return permissionGroupRepository.updateById(permissionGroup.getId(), permissionGroup, AclPermission.ASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));

    }

    private Mono<PermissionGroup> bulkUnassignFromUsersAndGroups(PermissionGroup permissionGroup, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(permissionGroup);
        ensureAssignedToUserGroups(permissionGroup);

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toList());
        userIds.forEach(permissionGroup.getAssignedToUserIds()::remove);
        groupIds.forEach(permissionGroup.getAssignedToGroupIds()::remove);
        return permissionGroupRepository.updateById(permissionGroup.getId(), permissionGroup, UNASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));
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
}
