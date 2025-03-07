package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.AppsmithComparators;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.helpers.ce.DomainSorter.sortDomainsBasedOnOrderedDomainIds;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
public class UserWorkspaceServiceCEImpl implements UserWorkspaceServiceCE {
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final UserRepository userRepository;
    private final UserDataService userDataService;
    private final PermissionGroupService permissionGroupService;
    private final OrganizationService organizationService;
    private final WorkspacePermission workspacePermission;
    private final PermissionGroupPermission permissionGroupPermission;

    @Autowired
    public UserWorkspaceServiceCEImpl(
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            UserRepository userRepository,
            UserDataService userDataService,
            PermissionGroupService permissionGroupService,
            OrganizationService organizationService,
            WorkspacePermission workspacePermission,
            PermissionGroupPermission permissionGroupPermission) {
        this.sessionUserService = sessionUserService;
        this.workspaceService = workspaceService;
        this.userRepository = userRepository;
        this.userDataService = userDataService;
        this.permissionGroupService = permissionGroupService;
        this.organizationService = organizationService;
        this.workspacePermission = workspacePermission;
        this.permissionGroupPermission = permissionGroupPermission;
    }

    @Override
    public Mono<User> leaveWorkspace(String workspaceId) {
        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, workspacePermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        Mono<PermissionGroup> oldDefaultPermissionGroupsMono = Mono.zip(workspaceMono, userMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return permissionGroupService.getAllByAssignedToUserAndDefaultWorkspace(
                            user, workspace, permissionGroupPermission.getAssignPermission());
                })
                /*
                 * The below switchIfEmpty will be invoked in 2 cases.
                 * 1. Explicit Backend Invocation: The user actually didn't have access to the Workspace.
                 * 2. User Interaction: User who is part of a UserGroup.
                 */
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Workspace is not assigned to the user.")))
                // User must be assigned to a single default role of the workspace. We can safely use single() here.
                .single()
                .flatMap(permissionGroup -> {
                    if (permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR)
                            && permissionGroup.getAssignedToUserIds().size() == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(permissionGroup);
                })
                // If we cannot find the groups, that means either user is not part of any default group or current user
                // has no access to the group
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change role of a member")));

        // the user is being removed from the workspace. Remove the workspace from recent workspace list of UserData
        Mono<Void> updateUserDataMono = userMono.flatMap(
                user -> userDataService.removeRecentWorkspaceAndChildEntities(user.getId(), workspaceId));

        Mono<Boolean> removeUserFromOldPermissionGroupMono = oldDefaultPermissionGroupsMono.flatMap(
                permissionGroup -> permissionGroupService.leaveExplicitlyAssignedSelfRole(permissionGroup.getId()));

        return removeUserFromOldPermissionGroupMono.then(updateUserDataMono).then(userMono);
    }

    /**
     * This method is used when an admin of a workspace changes the role or removes a member.
     * Admin user can also remove itself from the workspace, if there is another admin there in the workspace.
     *
     * @param workspaceId        ID of the workspace
     * @param changeUserGroupDTO updated role of the target member. userRole.roleName will be null when removing a member
     * @param originHeader
     * @return The updated UserRole
     */
    @Transactional
    @Override
    public Mono<MemberInfoDTO> updatePermissionGroupForMember(
            String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader) {
        if (changeUserGroupDTO.getUsername() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAME));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, workspacePermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .cache();

        // Get the user
        Mono<User> userMono = organizationService
                .getDefaultOrganizationId()
                .flatMap(organizationId ->
                        userRepository.findByEmailAndOrganizationId(changeUserGroupDTO.getUsername(), organizationId))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, changeUserGroupDTO.getUsername())))
                .cache();

        Mono<PermissionGroup> oldDefaultPermissionGroupMono = Mono.zip(workspaceMono, userMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return permissionGroupService.getAllByAssignedToUserAndDefaultWorkspace(
                            user, workspace, permissionGroupPermission.getUnAssignPermission());
                })
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")))
                .single()
                .zipWhen(permissionGroup -> isLastAdminRoleEntity(permissionGroup))
                .flatMap(tuple2 -> {
                    PermissionGroup permissionGroup = tuple2.getT1();
                    Boolean isLastAdminRoleEntity = tuple2.getT2();
                    if (TRUE.equals(isLastAdminRoleEntity)) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(permissionGroup);
                });

        /*
         * The below operations have been changed from parallel execution (zipWith) to a sequential execution (zipWhen).
         * MongoTransactions have a limitation that there should be only 1 DB operation which should initiate the transaction.
         * But here, since 2 DB operations were happening in parallel, we were observing an intermittent exception: "Command failed with error 251 (NoSuchTransaction)".
         *
         * The below operation is responsible for the first DB operation, if a user is removed from the workspace.
         */
        // Unassigned old permission group from user
        Mono<PermissionGroup> permissionGroupUnassignedMono = userMono.zipWhen(user -> oldDefaultPermissionGroupMono)
                .flatMap(pair -> permissionGroupService.unAssignFromUserAndSendEvent(pair.getT2(), pair.getT1()));

        // If new permission group id is not present, just unassign old permission group and return
        // PermissionAndGroupDTO
        if (!StringUtils.hasText(changeUserGroupDTO.getNewPermissionGroupId())) {
            return permissionGroupUnassignedMono.then(userMono).map(user -> MemberInfoDTO.builder()
                    .username(user.getUsername())
                    .name(user.getName())
                    .build());
        }

        // Get the new permission group
        Mono<PermissionGroup> newDefaultPermissionGroupMono = permissionGroupService
                .getById(changeUserGroupDTO.getNewPermissionGroupId(), permissionGroupPermission.getAssignPermission())
                // If we cannot find the group, that means either newGroupId is not a default group or current user has
                // no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")));

        // Unassign old permission group, assign new permission group
        Mono<PermissionGroup> changePermissionGroupsMono = newDefaultPermissionGroupMono.flatMap(newPermissionGroup -> {
            return permissionGroupUnassignedMono
                    .then(userMono)
                    .flatMap(user -> permissionGroupService.assignToUserAndSendEvent(newPermissionGroup, user));
        });

        /*
         * The below operation is responsible for the first DB operation, if workspace role is changed ƒor the user,
         * hence we need to make this operation sequential as well.
         */
        return userMono.zipWhen(user -> changePermissionGroupsMono).map(pair -> {
            User user = pair.getT1();
            PermissionGroup role = pair.getT2();
            PermissionGroupInfoDTO roleInfoDTO =
                    new PermissionGroupInfoDTO(role.getId(), role.getName(), role.getDescription());
            roleInfoDTO.setEntityType(Workspace.class.getSimpleName());
            return MemberInfoDTO.builder()
                    .username(user.getUsername())
                    .name(user.getName())
                    .roles(List.of(roleInfoDTO))
                    .build();
        });
    }

    @Override
    public Mono<List<MemberInfoDTO>> getWorkspaceMembers(String workspaceId) {

        // Get default permission groups
        Flux<PermissionGroup> permissionGroupFlux = this.getPermissionGroupsForWorkspace(workspaceId);

        // Create a list of UserAndGroupDTO
        Mono<List<MemberInfoDTO>> userAndPermissionGroupDTOsMono = permissionGroupFlux
                .collectList()
                .map(this::mapPermissionGroupListToUserAndPermissionGroupDTOList)
                .cache();

        // get a list of user ids who are member of this workspace
        Mono<Set<String>> userIdsMono = userAndPermissionGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .map(MemberInfoDTO::getUserId)
                .collect(Collectors.toSet())
                .cache();

        // Create a map of User.id to User
        Mono<Map<String, User>> userMapMono =
                userIdsMono.flatMapMany(userRepository::findAllById).collectMap(User::getId);

        // Create a map of UserData.userUd to UserData
        Mono<Map<String, String>> userDataMapMono = userIdsMono
                // get the profile photos of the list of users
                .flatMap(userIdsSet -> userDataService.getProfilePhotoAssetIdsForUserIds(
                userIdsSet.stream().toList()));

        // Update name and username in the list of UserAndGroupDTO
        userAndPermissionGroupDTOsMono = Mono.zip(userAndPermissionGroupDTOsMono, userMapMono, userDataMapMono)
                .map(tuple -> {
                    List<MemberInfoDTO> workspaceMemberInfoDTOList = tuple.getT1();
                    Map<String, User> userMap = tuple.getT2();
                    Map<String, String> userDataMap = tuple.getT3();
                    workspaceMemberInfoDTOList.forEach(userAndPermissionGroupDTO -> {
                        User user = userMap.get(userAndPermissionGroupDTO.getUserId());
                        userAndPermissionGroupDTO.setName(
                                Optional.ofNullable(user.getName()).orElse(user.computeFirstName()));
                        userAndPermissionGroupDTO.setUsername(user.getUsername());
                        userAndPermissionGroupDTO.setPhotoId(userDataMap.get(userAndPermissionGroupDTO.getUserId()));
                    });
                    return workspaceMemberInfoDTOList;
                });

        // Sort the members by permission group
        // TODO get users sorted from DB and fill in three buckets - admin, developer and viewer
        Mono<List<MemberInfoDTO>> sortedListMono = userAndPermissionGroupDTOsMono.map(userAndPermissionGroupDTOS -> {
            Collections.sort(userAndPermissionGroupDTOS, AppsmithComparators.workspaceMembersComparator());

            return userAndPermissionGroupDTOS;
        });

        return sortedListMono;
    }

    @Override
    public Mono<Map<String, List<MemberInfoDTO>>> getWorkspaceMembers(Set<String> workspaceIds) {

        // Get default permission groups
        Flux<PermissionGroup> permissionGroupFlux = permissionGroupService
                .getByDefaultWorkspaces(workspaceIds, permissionGroupPermission.getMembersReadPermission())
                .cache();

        Mono<Map<String, Collection<PermissionGroup>>> permissionGroupsByWorkspacesMono = permissionGroupFlux
                .collectMultimap(PermissionGroup::getDefaultDomainId)
                .cache();

        Mono<Set<String>> userIdsMono = permissionGroupFlux
                .flatMapIterable(permissionGroup -> {
                    Set<String> assignedToUserIds = permissionGroup.getAssignedToUserIds();
                    if (assignedToUserIds == null || assignedToUserIds.isEmpty()) {
                        return new HashSet<>();
                    }
                    return assignedToUserIds;
                })
                .collect(Collectors.toSet())
                .cache();

        Mono<Map<String, User>> userMapMono =
                userIdsMono.flatMapMany(userRepository::findAllById).collectMap(User::getId);

        // Create a map of UserData.userUd to UserData
        Mono<Map<String, String>> userDataMapMono =
                userIdsMono.flatMap(userDataService::getProfilePhotoAssetIdsForUserIds);

        Flux<Map<String, Collection<PermissionGroup>>> permissionGroupsByWorkspaceFlux =
                permissionGroupsByWorkspacesMono.repeat();

        Mono<Map<String, List<MemberInfoDTO>>> workspaceMembersMono = permissionGroupsByWorkspacesMono
                .flatMapMany(permissionGroupsByWorkspaces -> Flux.fromIterable(permissionGroupsByWorkspaces.keySet()))
                .zipWith(permissionGroupsByWorkspaceFlux)
                .flatMap(tuple -> {
                    String workspaceId = tuple.getT1();
                    Map<String, Collection<PermissionGroup>> collectionMap = tuple.getT2();
                    List<PermissionGroup> permissionGroups =
                            collectionMap.get(workspaceId).stream().collect(Collectors.toList());

                    Mono<List<MemberInfoDTO>> userAndPermissionGroupDTOsMono = Mono.zip(
                                    Mono.just(mapPermissionGroupListToUserAndPermissionGroupDTOList(permissionGroups)),
                                    userMapMono,
                                    userDataMapMono)
                            .map(tuple1 -> {
                                List<MemberInfoDTO> workspaceMemberInfoDTOList = tuple1.getT1();
                                Map<String, User> userMap = tuple1.getT2();
                                Map<String, String> userDataMap = tuple1.getT3();
                                workspaceMemberInfoDTOList.forEach(userAndPermissionGroupDTO -> {
                                    User user = userMap.get(userAndPermissionGroupDTO.getUserId());
                                    userAndPermissionGroupDTO.setName(
                                            Optional.ofNullable(user.getName()).orElse(user.computeFirstName()));
                                    userAndPermissionGroupDTO.setUsername(user.getUsername());
                                    userAndPermissionGroupDTO.setPhotoId(
                                            userDataMap.get(userAndPermissionGroupDTO.getUserId()));
                                });
                                return workspaceMemberInfoDTOList;
                            });

                    return Mono.zip(Mono.just(workspaceId), userAndPermissionGroupDTOsMono);
                })
                .collectMap(Tuple2::getT1, Tuple2::getT2);

        return workspaceMembersMono;
    }

    private List<MemberInfoDTO> mapPermissionGroupListToUserAndPermissionGroupDTOList(
            List<PermissionGroup> permissionGroupList) {
        Set<String> userIds = new HashSet<>(); // Set of already collected users
        List<MemberInfoDTO> userAndGroupDTOList = new ArrayList<>();
        permissionGroupList.forEach(permissionGroup -> {
            PermissionGroupInfoDTO roleInfoDTO = new PermissionGroupInfoDTO(
                    permissionGroup.getId(), permissionGroup.getName(), permissionGroup.getDescription());
            roleInfoDTO.setEntityType(Workspace.class.getSimpleName());
            Stream.ofNullable(permissionGroup.getAssignedToUserIds())
                    .flatMap(Collection::stream)
                    .filter(userId -> !userIds.contains(userId))
                    .forEach(userId -> {
                        userAndGroupDTOList.add(MemberInfoDTO.builder()
                                .userId(userId)
                                .roles(List.of(roleInfoDTO))
                                .build()); // collect user
                        userIds.add(userId); // update set of already collected users
                    });
        });
        return userAndGroupDTOList;
    }

    protected Flux<PermissionGroup> getPermissionGroupsForWorkspace(String workspaceId) {
        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, workspacePermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        // Get default permission groups
        return workspaceMono.flatMapMany(workspace -> permissionGroupService.getByDefaultWorkspace(
                workspace, permissionGroupPermission.getMembersReadPermission()));
    }

    @Override
    public Mono<Boolean> isLastAdminRoleEntity(PermissionGroup permissionGroup) {
        return Mono.just(permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR)
                && permissionGroup.getAssignedToUserIds().size() == 1);
    }

    /**
     * This function returns the list of workspaces for the current user in the order of recently used.
     *
     * @return Mono of list of workspaces
     */
    @Override
    public Mono<List<Workspace>> getUserWorkspacesByRecentlyUsedOrder(String hostname) {

        Mono<List<String>> workspaceIdsMono = userDataService
                .getForCurrentUser()
                .defaultIfEmpty(new UserData())
                .map(userData -> {
                    if (userData.getRecentlyUsedEntityIds() == null) {
                        return Collections.emptyList();
                    }
                    return userData.getRecentlyUsedEntityIds().stream()
                            .map(RecentlyUsedEntityDTO::getWorkspaceId)
                            .collect(Collectors.toList());
                });

        return workspaceIdsMono.flatMap(workspaceIds -> workspaceService
                .getAll(workspacePermission.getReadPermission())
                // sort transformation
                .transform(domainFlux -> sortDomainsBasedOnOrderedDomainIds(domainFlux, workspaceIds))
                // collect to list to keep the order of the workspaces
                .collectList());
    }
}
