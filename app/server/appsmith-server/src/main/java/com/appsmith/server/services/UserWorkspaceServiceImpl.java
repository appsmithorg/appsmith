package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserWorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.helpers.AppsmithComparators.permissionGroupInfoForWorkspaceAndApplicationMembersComparator;
import static com.appsmith.server.helpers.AppsmithComparators.workspaceMembersComparator;

@Service
@Slf4j
public class UserWorkspaceServiceImpl extends UserWorkspaceServiceCEImpl implements UserWorkspaceService {

    private final UserGroupRepository userGroupRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TenantService tenantService;
    private final PermissionGroupService permissionGroupService;
    private final ApplicationMemberService applicationMemberService;

    public UserWorkspaceServiceImpl(SessionUserService sessionUserService,
                                    WorkspaceRepository workspaceRepository,
                                    UserRepository userRepository,
                                    UserDataRepository userDataRepository,
                                    PolicyUtils policyUtils,
                                    EmailSender emailSender,
                                    UserDataService userDataService,
                                    PermissionGroupService permissionGroupService,
                                    TenantService tenantService,
                                    UserGroupRepository userGroupRepository,
                                    WorkspacePermission workspacePermission,
                                    PermissionGroupPermission permissionGroupPermission,
                                    ApplicationMemberService applicationMemberService) {

        super(sessionUserService, workspaceRepository, userRepository, userDataRepository, policyUtils, emailSender,
                userDataService, permissionGroupService, tenantService, workspacePermission, permissionGroupPermission);
        this.userGroupRepository = userGroupRepository;
        this.workspaceRepository = workspaceRepository;
        this.tenantService = tenantService;
        this.permissionGroupService = permissionGroupService;
        this.applicationMemberService = applicationMemberService;
    }

    @Override
    public Mono<MemberInfoDTO> updatePermissionGroupForMember(String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader) {
        if (changeUserGroupDTO.getUsername() == null && changeUserGroupDTO.getUserGroupId() == null)
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAME + " or " + FieldName.GROUP_ID));
        if (Objects.nonNull(changeUserGroupDTO.getUsername()))
            return super.updatePermissionGroupForMember(workspaceId, changeUserGroupDTO, originHeader);

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .cache();
        Mono<UserGroup> userGroupMono = tenantService.getDefaultTenantId()
                .flatMap(tenantId -> userGroupRepository.findByIdAndTenantIdithoutPermission(changeUserGroupDTO.getUserGroupId(), tenantId))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER_GROUP, changeUserGroupDTO.getUserGroupId())))
                .cache();

        Mono<PermissionGroup> oldDefaultPermissionGroupMono = Mono.zip(workspaceMono, userGroupMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    UserGroup userGroup = tuple.getT2();
                    return permissionGroupService.getAllByAssignedToUserGroupAndDefaultWorkspace(userGroup, workspace, AclPermission.UNASSIGN_PERMISSION_GROUPS);
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")))
                .single()
                //Throw error if trying to remove the last admin entity from Permission Group
                .flatMap(permissionGroup -> {
                    if (this.isLastAdminRoleEntity(permissionGroup)) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(permissionGroup);
                });

        /*
         * The below operations have been changed from parallel execution (zipWith) to a sequential execution (zipWhen).
         * MongoTransactions have a limitation that there should be only 1 DB operation which should initiate the transaction.
         * But here, since 2 DB operations were happening in parallel, we were observing an intermittent exception: "Command failed with error 251 (NoSuchTransaction)".
         *
         * The below operation is responsible for the first DB operation, if a user group is removed from the workspace.
         */
        // Unassigned old permission group from userGroup
        Mono<PermissionGroup> permissionGroupUnassignedMono = userGroupMono
                .zipWhen(userGroup -> oldDefaultPermissionGroupMono)
                .flatMap(pair -> permissionGroupService.unAssignFromUserGroupAndSendEvent(pair.getT2(), pair.getT1()));

        // If new permission group id is not present, just unassign old permission group and return PermissionAndGroupDTO
        if (!StringUtils.hasText(changeUserGroupDTO.getNewPermissionGroupId())) {
            return permissionGroupUnassignedMono.then(userGroupMono)
                    .map(userGroup -> MemberInfoDTO.builder().userGroupId(userGroup.getId()).name(userGroup.getName()).build());
        }

        // Get the new permission group
        Mono<PermissionGroup> newDefaultPermissionGroupMono = permissionGroupService.getById(changeUserGroupDTO.getNewPermissionGroupId(), AclPermission.ASSIGN_PERMISSION_GROUPS)
                // If we cannot find the group, that means either newGroupId is not a default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")));

        Mono<PermissionGroup> changePermissionGroupsMono = newDefaultPermissionGroupMono
                .flatMap(newPermissionGroup -> permissionGroupUnassignedMono
                        .then(userGroupMono)
                        .flatMap(userGroup -> permissionGroupService.assignToUserGroupAndSendEvent(newPermissionGroup, userGroup)));

        /*
         * The below operation is responsible for the first DB operation, if workspace role is changed ƒor the user group,
         * hence we need to make this operation sequential as well.
         */
        return userGroupMono
                .zipWhen(userGroup -> changePermissionGroupsMono)
                .map(pair -> {
                    UserGroup userGroup = pair.getT1();
                    PermissionGroup role = pair.getT2();
                    PermissionGroupInfoDTO roleInfoDTO = new PermissionGroupInfoDTO(role.getId(), role.getName(), role.getDescription());
                    roleInfoDTO.setEntityType(Workspace.class.getSimpleName());
                    return MemberInfoDTO.builder()
                            .userGroupId(userGroup.getId())
                            .name(userGroup.getName())
                            .roles(List.of(roleInfoDTO))
                            .build();
                });
    }

    @Override
    public Mono<List<MemberInfoDTO>> getWorkspaceMembers(String workspaceId) {
        Mono<List<MemberInfoDTO>> sortedOnlyUsersWorkspaceMembersMono = super.getWorkspaceMembers(workspaceId);
        Mono<List<MemberInfoDTO>> unsortedOnlyUserGroupWorkspaceMembersMono = getUserGroupMembersForWorkspace(workspaceId);

        Mono<List<MemberInfoDTO>> workspaceMembersMono = Flux.concat(unsortedOnlyUserGroupWorkspaceMembersMono, sortedOnlyUsersWorkspaceMembersMono)
                .flatMap(Flux::fromIterable)
                .collectList();
        Mono<List<MemberInfoDTO>> workspaceApplicationMembersFlux = applicationMemberService.getAllApplicationsMembersForWorkspace(workspaceId).collectList();

        return Mono.zip(workspaceMembersMono, workspaceApplicationMembersFlux)
                .map(tuple -> getCombinedWorkspaceAndApplicationMembersList(tuple.getT1(), tuple.getT2()))
                .map(memberList -> {
                    memberList.sort(workspaceMembersComparator());
                    return memberList;
                });
    }

    /**
     * Combines the workspace members list and application members list into a single list.
     * First, create 2 maps:
     * - Map 1: map of user ids to list of members with same user id.
     * - Map 2: map of user group ids to list of members with the same user group id.
     *
     * From Map #1 and Map #2, generate unique members with list of roles.
     * The list of roles will be sorted using the permissionGroupInfoForWorkspaceAndApplicationMembersComparator().
     * Note: We will prepend an empty workspace role to the list of roles, if no default workspace role exist in the list.
     * This is done in order to make sure, that if no default workspace role is assigned to a member, then a dummy
     * workspace role is still at the top of the list.
     *
     * @param workspaceMembers
     * @param applicationMembers
     * @return
     */
    private List<MemberInfoDTO> getCombinedWorkspaceAndApplicationMembersList(List<MemberInfoDTO> workspaceMembers, List<MemberInfoDTO> applicationMembers) {
        List<MemberInfoDTO> allMembers = new ArrayList<>();
        Map<String, List<MemberInfoDTO>> userIdToDifferentRoleMembers = Stream.of(workspaceMembers, applicationMembers)
                .flatMap(Collection::stream)
                .filter(member -> !StringUtils.hasLength(member.getUserGroupId()))
                .collect(Collectors.groupingBy(MemberInfoDTO::getUserId));
        Map<String, List<MemberInfoDTO>> userGroupIdToDifferentRoleMembers = Stream.of(workspaceMembers, applicationMembers)
                .flatMap(Collection::stream)
                .filter(member -> StringUtils.hasLength(member.getUserGroupId()))
                .collect(Collectors.groupingBy(MemberInfoDTO::getUserGroupId));

        userIdToDifferentRoleMembers.forEach((userId, memberWithDifferentRoles) -> {
            String username = memberWithDifferentRoles.get(0).getUsername();
            String name = memberWithDifferentRoles.get(0).getName();
            String photoId = memberWithDifferentRoles.get(0).getPhotoId();
            List<PermissionGroupInfoDTO> roles = memberWithDifferentRoles.stream()
                    .map(MemberInfoDTO::getRoles)
                    .flatMap(Collection::stream)
                    .sorted(permissionGroupInfoForWorkspaceAndApplicationMembersComparator())
                    .toList();
            List<PermissionGroupInfoDTO> finalRolesWithWorkspaceRole = checkAndPrependEmptyWorkspaceRoleNotPresent(roles);
            MemberInfoDTO member = MemberInfoDTO.builder()
                    .username(username)
                    .name(name)
                    .userId(userId)
                    .photoId(photoId)
                    .roles(finalRolesWithWorkspaceRole)
                    .build();
            allMembers.add(member);
        });

        userGroupIdToDifferentRoleMembers.forEach((userGroupId, memberWithDifferentRoles) -> {
            String name = memberWithDifferentRoles.get(0).getName();
            List<PermissionGroupInfoDTO> roles = memberWithDifferentRoles.stream()
                    .map(MemberInfoDTO::getRoles)
                    .flatMap(Collection::stream)
                    .sorted(permissionGroupInfoForWorkspaceAndApplicationMembersComparator())
                    .toList();
            List<PermissionGroupInfoDTO> finalRolesWithWorkspaceRole = checkAndPrependEmptyWorkspaceRoleNotPresent(roles);
            MemberInfoDTO member = MemberInfoDTO.builder()
                    .name(name)
                    .userGroupId(userGroupId)
                    .roles(finalRolesWithWorkspaceRole)
                    .build();
            allMembers.add(member);
        });

        return allMembers;
    }
    private Mono<List<MemberInfoDTO>> getUserGroupMembersForWorkspace(String workspaceId) {
        Flux<PermissionGroup> permissionGroupFlux = this.getPermissionGroupsForWorkspace(workspaceId);

        Mono<List<MemberInfoDTO>> userGroupAndPermissionGroupDTOsMono = permissionGroupFlux
                .collectList()
                .map(this::mapPermissionGroupListToUserGroups)
                .cache();

        Mono<Map<String, UserGroup>> userGroupMapMono = userGroupAndPermissionGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .map(MemberInfoDTO::getUserGroupId)
                .collect(Collectors.toSet())
                .flatMapMany(userGroupRepository::findAllById)
                .collectMap(UserGroup::getId)
                .cache();

        return userGroupAndPermissionGroupDTOsMono
                .zipWith(userGroupMapMono)
                .map(tuple -> {
                    List<MemberInfoDTO> memberInfoDTOList = tuple.getT1();
                    Map<String, UserGroup> userGroupMap = tuple.getT2();
                    memberInfoDTOList.forEach(memberInfoDTO -> {
                        UserGroup userGroup = userGroupMap.get(memberInfoDTO.getUserGroupId());
                        memberInfoDTO.setName(userGroup.getName());
                        memberInfoDTO.setUsername(userGroup.getName());
                    });
                    return memberInfoDTOList;
                });
    }

    /**
     * This is a utility to prepend a dummy workspace role to the list of roles, if no workspace role exists in the list of roles.
     * @param roles
     * @return
     */
    private List<PermissionGroupInfoDTO> checkAndPrependEmptyWorkspaceRoleNotPresent(List<PermissionGroupInfoDTO> roles) {
        boolean isWorkspaceRolePresent = roles.stream().anyMatch(role -> Workspace.class.getSimpleName().equals(role.getEntityType()));
        if (isWorkspaceRolePresent) {
            return roles;
        }

        // Empty Workspace Role
        PermissionGroupInfoDTO emptyWorkspaceRole = new PermissionGroupInfoDTO();
        emptyWorkspaceRole.setEntityType(Workspace.class.getSimpleName());
        // Creating a new list to avoid UnsupportedOperationException on adding the empty workspace role.
        List<PermissionGroupInfoDTO> updatedRoles = new ArrayList<>();
        updatedRoles.add(emptyWorkspaceRole);
        updatedRoles.addAll(roles);
        return updatedRoles;
    }

    // Create a list of all the PermissionGroup IDs to UserGroup IDs associations
    // and store them as MemberInfoDTO.
    private List<MemberInfoDTO> mapPermissionGroupListToUserGroups(List<PermissionGroup> permissionGroupList) {
        List<MemberInfoDTO> memberInfoDTOList = new ArrayList<>();
        permissionGroupList.forEach(permissionGroup -> {
            PermissionGroupInfoDTO roleInfoDTO = new PermissionGroupInfoDTO(permissionGroup.getId(), permissionGroup.getName(), permissionGroup.getDescription());
            roleInfoDTO.setEntityType(Workspace.class.getSimpleName());
            permissionGroup.getAssignedToGroupIds().forEach(userGroupId -> {
                memberInfoDTOList.add(MemberInfoDTO.builder()
                        .userGroupId(userGroupId)
                        .roles(List.of(roleInfoDTO))
                        .build()); // collect user groups
            });
        });
        return memberInfoDTOList;
    }

    @Override
    public Boolean isLastAdminRoleEntity(PermissionGroup permissionGroup) {
        return permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR)
                && ((permissionGroup.getAssignedToUserIds().size() == 1 && permissionGroup.getAssignedToGroupIds().size() == 0)
                || (permissionGroup.getAssignedToUserIds().size() == 0 && permissionGroup.getAssignedToGroupIds().size() == 1));
    }
}