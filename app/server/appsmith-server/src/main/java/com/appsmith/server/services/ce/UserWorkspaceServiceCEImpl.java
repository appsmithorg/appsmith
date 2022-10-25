package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.UserAndPermissionGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Slf4j
public class UserWorkspaceServiceCEImpl implements UserWorkspaceServiceCE {
    private final SessionUserService sessionUserService;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final UserDataRepository userDataRepository;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;
    private final UserDataService userDataService;
    private final PermissionGroupService permissionGroupService;
    private final TenantService tenantService;

    private static final String UPDATE_ROLE_EXISTING_USER_TEMPLATE = "email/updateRoleExistingUserTemplate.html";

    @Autowired
    public UserWorkspaceServiceCEImpl(SessionUserService sessionUserService,
                                      WorkspaceRepository workspaceRepository,
                                      UserRepository userRepository,
                                      UserDataRepository userDataRepository,
                                      PolicyUtils policyUtils,
                                      EmailSender emailSender,
                                      UserDataService userDataService,
                                      PermissionGroupService permissionGroupService,
                                      TenantService tenantService) {
        this.sessionUserService = sessionUserService;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.userDataRepository = userDataRepository;
        this.policyUtils = policyUtils;
        this.emailSender = emailSender;
        this.userDataService = userDataService;
        this.permissionGroupService = permissionGroupService;
        this.tenantService = tenantService;
    }

    @Override
    public Mono<User> leaveWorkspace(String workspaceId) {
        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        Mono<PermissionGroup> oldDefaultPermissionGroupsMono = Mono.zip(workspaceMono, userMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return permissionGroupService.getAllByAssignedToUserAndDefaultWorkspace(user, workspace, AclPermission.UNASSIGN_PERMISSION_GROUPS);
                })
                .single()
                .flatMap(permissionGroup -> {
                    if (permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR) && permissionGroup.getAssignedToUserIds().size() == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(permissionGroup);
                })
                // If we cannot find the groups, that means either user is not part of any default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change role of a member")));

        // the user is being removed from the workspace. Remove the workspace from recent workspace list of UserData
        Mono<UpdateResult> updateUserDataMono = userMono
                .flatMap(user -> userDataService
                        .removeRecentWorkspaceAndApps(user.getId(), workspaceId));

        Mono<PermissionGroup> removeUserFromOldPermissionGroupMono = oldDefaultPermissionGroupsMono
                .zipWith(userMono)
                .flatMap(tuple -> permissionGroupService.unassignFromUser(tuple.getT1(), tuple.getT2()));

        return removeUserFromOldPermissionGroupMono
                .then(updateUserDataMono)
                .then(userMono);
    }

    /**
     * This method is used when an admin of an workspace changes the role or removes a member.
     * Admin user can also remove itself from the workspace, if there is another admin there in the workspace.
     *
     * @param workspaceId        ID of the workspace
     * @param changeUserGroupDTO updated role of the target member. userRole.roleName will be null when removing a member
     * @param originHeader
     * @return The updated UserRole
     */
    @Transactional
    @Override
    public Mono<UserAndPermissionGroupDTO> updatePermissionGroupForMember(String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader) {
        if (changeUserGroupDTO.getUsername() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAME));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .cache();

        // Get the user
        Mono<User> userMono = tenantService.getDefaultTenantId()
                .flatMap(tenantId -> userRepository.findByEmailAndTenantId(changeUserGroupDTO.getUsername(), tenantId))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, changeUserGroupDTO.getUsername())))
                .cache();

        Mono<PermissionGroup> oldDefaultPermissionGroupMono = Mono.zip(workspaceMono, userMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return permissionGroupService.getAllByAssignedToUserAndDefaultWorkspace(user, workspace, AclPermission.UNASSIGN_PERMISSION_GROUPS);
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")))
                .single()
                .flatMap(permissionGroup -> {
                    if (permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR) && permissionGroup.getAssignedToUserIds().size() == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(permissionGroup);
                });

        // Unassigned old permission group from user
        Mono<PermissionGroup> permissionGroupUnassignedMono = oldDefaultPermissionGroupMono
                .zipWith(userMono)
                .flatMap(pair -> permissionGroupService.unassignFromUser(pair.getT1(), pair.getT2()));

        // If new permission group id is not present, just unassign old permission group and return PermissionAndGroupDTO
        if (!StringUtils.hasText(changeUserGroupDTO.getNewPermissionGroupId())) {
            return permissionGroupUnassignedMono.then(userMono)
                    .map(user -> UserAndPermissionGroupDTO.builder().username(user.getUsername()).name(user.getName()).build());
        }

        // Get the new permission group
        Mono<PermissionGroup> newDefaultPermissionGroupMono = permissionGroupService.getById(changeUserGroupDTO.getNewPermissionGroupId(), AclPermission.ASSIGN_PERMISSION_GROUPS)
                // If we cannot find the group, that means either newGroupId is not a default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")));

        // Unassign old permission group, assign new permission group
        Mono<PermissionGroup> changePermissionGroupsMono = newDefaultPermissionGroupMono
                .flatMap(newPermissionGroup -> {
                    return permissionGroupUnassignedMono
                            .then(userMono)
                            .flatMap(user -> permissionGroupService.assignToUser(newPermissionGroup, user));
                });

        return changePermissionGroupsMono
                .zipWith(userMono)
                .map(pair -> {
                    User user = pair.getT2();
                    PermissionGroup newPermissionGroup = pair.getT1();
                    return UserAndPermissionGroupDTO.builder()
                            .username(user.getUsername())
                            .name(user.getName())
                            .permissionGroupName(newPermissionGroup.getName())
                            .permissionGroupId(newPermissionGroup.getId())
                            .build();
                });
    }

    @Override
    public Mono<List<UserAndPermissionGroupDTO>> getWorkspaceMembers(String workspaceId) {

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        // Get default permission groups
        Flux<PermissionGroup> permissionGroupFlux = workspaceMono
                .flatMapMany(workspace -> permissionGroupService.getByDefaultWorkspace(workspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS));

        // Create a list of UserAndGroupDTO
        Mono<List<UserAndPermissionGroupDTO>> userAndPermissionGroupDTOsMono = permissionGroupFlux
                .collectList()
                .map(this::mapPermissionGroupListToUserAndPermissionGroupDTOList)
                .cache();

        // Create a map of User.userId to User
        Mono<Map<String, User>> userMapMono = userAndPermissionGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .map(UserAndPermissionGroupDTO::getUserId)
                .collect(Collectors.toSet())
                .flatMapMany(userIds -> userRepository.findAllById(userIds))
                .collectMap(User::getId)
                .cache();

        // Update name and username in the list of UserAndGroupDTO
        userAndPermissionGroupDTOsMono = userAndPermissionGroupDTOsMono
                .zipWith(userMapMono)
                .map(tuple -> {
                    List<UserAndPermissionGroupDTO> userAndPermissionGroupDTOList = tuple.getT1();
                    Map<String, User> userMap = tuple.getT2();
                    userAndPermissionGroupDTOList.forEach(userAndPermissionGroupDTO -> {
                        User user = userMap.get(userAndPermissionGroupDTO.getUserId());
                        userAndPermissionGroupDTO.setName(Optional.ofNullable(user.getName()).orElse(user.computeFirstName()));
                        userAndPermissionGroupDTO.setUsername(user.getUsername());
                    });
                    return userAndPermissionGroupDTOList;
                });

        // Sort the members by permission group
        //TODO get users sorted from DB and fill in three buckets - admin, developer and viewer
        Mono<List<UserAndPermissionGroupDTO>> sortedListMono = userAndPermissionGroupDTOsMono
                .map(userAndPermissionGroupDTOS -> {
                    Collections.sort(userAndPermissionGroupDTOS, new Comparator<UserAndPermissionGroupDTO>() {
                        @Override
                        public int compare(UserAndPermissionGroupDTO o1, UserAndPermissionGroupDTO o2) {
                            int order1 = getOrder(o1.getPermissionGroupName());
                            int order2 = getOrder(o2.getPermissionGroupName());

                            // Administrator > Developer > App viewer
                            int permissionGroupSortOrder = order1 - order2;

                            if (permissionGroupSortOrder != 0) {
                                return permissionGroupSortOrder;
                            }

                            return o1.getUsername().compareTo(o2.getUsername());
                        }

                        private int getOrder(String name) {
                            if (name.startsWith(FieldName.ADMINISTRATOR)) {
                                return 0;
                            } else if (name.startsWith(FieldName.DEVELOPER)) {
                                return 1;
                            } else {
                                return 2;
                            }
                        }
                    });

                    return userAndPermissionGroupDTOS;
                });

        return sortedListMono;
    }

    @Override
    public Mono<Map<String, List<UserAndPermissionGroupDTO>>> getWorkspaceMembers(Set<String> workspaceIds) {

        // Get default permission groups
        Flux<PermissionGroup> permissionGroupFlux = permissionGroupService.getByDefaultWorkspaces(workspaceIds, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .cache();

        Mono<Map<String, Collection<PermissionGroup>>> permissionGroupsByWorkspacesMono = permissionGroupFlux
                .collectMultimap(permissionGroup -> permissionGroup.getDefaultWorkspaceId(), permissionGroup -> permissionGroup)
                .cache();

        Mono<Map<String, User>> userMapMono = permissionGroupFlux
                .flatMapIterable(permissionGroup -> {
                    Set<String> assignedToUserIds = permissionGroup.getAssignedToUserIds();
                    if (assignedToUserIds == null || assignedToUserIds.isEmpty()) {
                        return new HashSet<>();
                    }
                    return assignedToUserIds;
                })
                .collect(Collectors.toSet())
                .flatMapMany(userIds -> userRepository.findAllById(userIds))
                .collectMap(User::getId)
                .cache();

        Flux<Map<String, Collection<PermissionGroup>>> permissionGroupsByWorkspaceFlux = permissionGroupsByWorkspacesMono
                .repeat();

        Mono<Map<String, List<UserAndPermissionGroupDTO>>> workspaceMembersMono = permissionGroupsByWorkspacesMono
                .flatMapMany(permissionGroupsByWorkspaces -> Flux.fromIterable(permissionGroupsByWorkspaces.keySet()))
                .zipWith(permissionGroupsByWorkspaceFlux)
                .flatMap(tuple -> {
                    String workspaceId = tuple.getT1();
                    Map<String, Collection<PermissionGroup>> collectionMap = tuple.getT2();
                    List<PermissionGroup> permissionGroups = collectionMap.get(workspaceId).stream().collect(Collectors.toList());

                    Mono<List<UserAndPermissionGroupDTO>> userAndPermissionGroupDTOsMono = Mono.just(mapPermissionGroupListToUserAndPermissionGroupDTOList(permissionGroups))
                            .zipWith(userMapMono)
                            .map(tuple1 -> {
                                List<UserAndPermissionGroupDTO> userAndPermissionGroupDTOList = tuple1.getT1();
                                Map<String, User> userMap = tuple1.getT2();
                                userAndPermissionGroupDTOList.forEach(userAndPermissionGroupDTO -> {
                                    User user = userMap.get(userAndPermissionGroupDTO.getUserId());
                                    userAndPermissionGroupDTO.setName(Optional.ofNullable(user.getName()).orElse(user.computeFirstName()));
                                    userAndPermissionGroupDTO.setUsername(user.getUsername());
                                });
                                return userAndPermissionGroupDTOList;
                            });

                    return Mono.zip(Mono.just(workspaceId), userAndPermissionGroupDTOsMono);
                })
                .collectMap(tuple -> tuple.getT1(), tuple -> tuple.getT2());

        return workspaceMembersMono;
    }

    private List<UserAndPermissionGroupDTO> mapPermissionGroupListToUserAndPermissionGroupDTOList(List<PermissionGroup> permissionGroupList) {
        Set<String> userIds = new HashSet<>(); // Set of already collected users
        List<UserAndPermissionGroupDTO> userAndGroupDTOList = new ArrayList<>();
        permissionGroupList.forEach(permissionGroup -> {
            Stream.ofNullable(permissionGroup.getAssignedToUserIds()).flatMap(Collection::stream).filter(userId -> !userIds.contains(userId)).forEach(userId -> {
                userAndGroupDTOList.add(UserAndPermissionGroupDTO.builder()
                        .userId(userId)
                        .permissionGroupName(permissionGroup.getName())
                        .permissionGroupId(permissionGroup.getId())
                        .build()); // collect user
                userIds.add(userId); // update set of already collected users
            });
        });
        return userAndGroupDTOList;
    }
}
