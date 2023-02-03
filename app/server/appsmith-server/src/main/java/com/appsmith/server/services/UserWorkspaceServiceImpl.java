package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.AppsmithComparators;
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

@Service
@Slf4j
public class UserWorkspaceServiceImpl extends UserWorkspaceServiceCEImpl implements UserWorkspaceService {

    private final UserGroupRepository userGroupRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TenantService tenantService;
    private final PermissionGroupService permissionGroupService;

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
                                    PermissionGroupPermission permissionGroupPermission) {

        super(sessionUserService, workspaceRepository, userRepository, userDataRepository, policyUtils, emailSender,
                userDataService, permissionGroupService, tenantService, workspacePermission, permissionGroupPermission);
        this.userGroupRepository = userGroupRepository;
        this.workspaceRepository = workspaceRepository;
        this.tenantService = tenantService;
        this.permissionGroupService = permissionGroupService;
    }

    @Override
    public Mono<WorkspaceMemberInfoDTO> updatePermissionGroupForMember(String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader) {
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

        Mono<PermissionGroup> permissionGroupUnassignedMono = oldDefaultPermissionGroupMono
                .zipWith(userGroupMono)
                .flatMap(pair -> permissionGroupService.unassignFromUserGroup(pair.getT1(), pair.getT2()));

        // If new permission group id is not present, just unassign old permission group and return PermissionAndGroupDTO
        if (!StringUtils.hasText(changeUserGroupDTO.getNewPermissionGroupId())) {
            return permissionGroupUnassignedMono.then(userGroupMono)
                    .map(userGroup -> WorkspaceMemberInfoDTO.builder().userGroupId(userGroup.getId()).name(userGroup.getName()).build());
        }

        // Get the new permission group
        Mono<PermissionGroup> newDefaultPermissionGroupMono = permissionGroupService.getById(changeUserGroupDTO.getNewPermissionGroupId(), AclPermission.ASSIGN_PERMISSION_GROUPS)
                // If we cannot find the group, that means either newGroupId is not a default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change permissionGroup of a member")));

        Mono<PermissionGroup> changePermissionGroupsMono = newDefaultPermissionGroupMono
                .flatMap(newPermissionGroup -> permissionGroupUnassignedMono
                        .then(userGroupMono)
                        .flatMap(userGroup -> permissionGroupService.assignToUserGroup(newPermissionGroup, userGroup)));

        return changePermissionGroupsMono
                .zipWith(userGroupMono)
                .map(pair -> {
                    UserGroup userGroup = pair.getT2();
                    PermissionGroup newPermissionGroup = pair.getT1();
                    return WorkspaceMemberInfoDTO.builder()
                            .userGroupId(userGroup.getId())
                            .name(userGroup.getName())
                            .permissionGroupName(newPermissionGroup.getName())
                            .permissionGroupId(newPermissionGroup.getId())
                            .build();
                });
    }

    @Override
    public Mono<List<WorkspaceMemberInfoDTO>> getWorkspaceMembers(String workspaceId) {
        Mono<List<WorkspaceMemberInfoDTO>> sortedOnlyUsersWorkspaceMembersMono = super.getWorkspaceMembers(workspaceId);
        Flux<PermissionGroup> permissionGroupFlux = this.getPermissionGroupsForWorkspace(workspaceId);

        Mono<List<WorkspaceMemberInfoDTO>> userGroupAndPermissionGroupDTOsMono = permissionGroupFlux
                .collectList()
                .map(this::mapPermissionGroupListToUserGroups)
                .cache();

        Mono<Map<String, UserGroup>> userGroupMapMono = userGroupAndPermissionGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .map(WorkspaceMemberInfoDTO::getUserGroupId)
                .collect(Collectors.toSet())
                .flatMapMany(userGroupRepository::findAllById)
                .collectMap(UserGroup::getId)
                .cache();

        userGroupAndPermissionGroupDTOsMono = userGroupAndPermissionGroupDTOsMono
                .zipWith(userGroupMapMono)
                .map(tuple -> {
                    List<WorkspaceMemberInfoDTO> workspaceMemberInfoDTOList = tuple.getT1();
                    Map<String, UserGroup> userGroupMap = tuple.getT2();
                    workspaceMemberInfoDTOList.forEach(workspaceMemberInfoDTO -> {
                        UserGroup userGroup = userGroupMap.get(workspaceMemberInfoDTO.getUserGroupId());
                        workspaceMemberInfoDTO.setName(userGroup.getName());
                        workspaceMemberInfoDTO.setUsername(userGroup.getName());
                    });
                    return workspaceMemberInfoDTOList;
                });

        return userGroupAndPermissionGroupDTOsMono.zipWith(sortedOnlyUsersWorkspaceMembersMono)
                .map(tuple -> Stream.of(tuple.getT1(), tuple.getT2())
                        .flatMap(Collection::stream)
                        .collect(Collectors.toList()))
                .map(workspaceMemberInfoDTOS -> {
                    workspaceMemberInfoDTOS.sort(AppsmithComparators.getWorkspaceMemberComparator());
                    return workspaceMemberInfoDTOS;
                });
    }

    // Create a list of all the PermissionGroup IDs to UserGroup IDs associations
    // and store them as WorkspaceMemberInfoDTO.
    private List<WorkspaceMemberInfoDTO> mapPermissionGroupListToUserGroups(List<PermissionGroup> permissionGroupList) {
        List<WorkspaceMemberInfoDTO> workspaceMemberInfoDTOList = new ArrayList<>();
        permissionGroupList.forEach(permissionGroup -> {
            permissionGroup.getAssignedToGroupIds().forEach(userGroupId -> {
                workspaceMemberInfoDTOList.add(WorkspaceMemberInfoDTO.builder()
                        .userGroupId(userGroupId)
                        .permissionGroupName(permissionGroup.getName())
                        .permissionGroupId(permissionGroup.getId())
                        .build()); // collect user groups
            });
        });
        return workspaceMemberInfoDTOList;
    }

    @Override
    public Boolean isLastAdminRoleEntity(PermissionGroup permissionGroup) {
        return permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR)
                && ((permissionGroup.getAssignedToUserIds().size() == 1 && permissionGroup.getAssignedToGroupIds().size() == 0)
                || (permissionGroup.getAssignedToUserIds().size() == 0 && permissionGroup.getAssignedToGroupIds().size() == 1));
    }
}
