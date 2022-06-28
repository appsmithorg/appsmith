package com.appsmith.server.services.ce;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.UserInGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdateUserGroupDTO;
import com.appsmith.server.dtos.UserAndGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserGroupService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@Slf4j
public class UserWorkspaceServiceCEImpl implements UserWorkspaceServiceCE {
    private final SessionUserService sessionUserService;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final UserDataRepository userDataRepository;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;
    private final UserDataService userDataService;
    private final UserGroupService userGroupService;

    private static final String UPDATE_ROLE_EXISTING_USER_TEMPLATE = "email/updateRoleExistingUserTemplate.html";

    @Autowired
    public UserWorkspaceServiceCEImpl(SessionUserService sessionUserService,
                                      WorkspaceRepository workspaceRepository,
                                      UserRepository userRepository,
                                      UserDataRepository userDataRepository,
                                      PolicyUtils policyUtils,
                                      EmailSender emailSender,
                                      UserDataService userDataService,
                                      UserGroupService userGroupService) {
        this.sessionUserService = sessionUserService;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.userDataRepository = userDataRepository;
        this.policyUtils = policyUtils;
        this.emailSender = emailSender;
        this.userDataService = userDataService;
        this.userGroupService = userGroupService;
    }

    @Override
    public Mono<User> leaveWorkspace(String workspaceId) {
         // Read the workspace
         Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        Mono<User>  userMono = sessionUserService.getCurrentUser().cache();

        Mono<UserGroup> oldDefaultUserGroupsMono = Mono.zip(workspaceMono, userMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return userGroupService.getAllByUserIdAndDefaultWorkspaceId(user.getId(), workspace.getId(), AclPermission.READ_USER_GROUPS);
                })
                //TODO do we handle case of multiple default group ids
                .single()
                .flatMap(userGroup -> {
                    if(userGroup.getName().startsWith(FieldName.ADMINISTRATOR) && userGroup.getUsers().size() == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(userGroup);
                })
                // If we cannot find the groups, that means either user is not part of any default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change userGroup of a member")));

        return oldDefaultUserGroupsMono.flatMap(userGroup -> userGroupService.removeSelf(userGroup))
                .then(userMono);
    }

    /**
     * This method is used when an admin of an workspace changes the role or removes a member.
     * Admin user can also remove himself from the workspace, if there is another admin there in the workspace.
     * @param workspaceId ID of the workspace
     * @param changeUserGroupDTO updated role of the target member. userRole.roleName will be null when removing a member
     * @param originHeader
     * @return The updated UserRole
     */
    @Transactional
    @Override
    public Mono<UserAndGroupDTO> updateUserGroupForMember(String workspaceId, UpdateUserGroupDTO changeUserGroupDTO, String originHeader) {
        if (changeUserGroupDTO.getUsername() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAME));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .cache();

        // Get the user
        Mono<User> userMono = userRepository.findByEmail(changeUserGroupDTO.getUsername(), AclPermission.READ_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, changeUserGroupDTO.getUsername())))
                .cache();

        Mono<UserGroup> oldDefaultUserGroupMono = Mono.zip(workspaceMono, userMono)
                .flatMapMany(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return userGroupService.getAllByUserIdAndDefaultWorkspaceId(user.getId(), workspace.getId(), AclPermission.MANAGE_USER_GROUPS);
                })
                //TODO do we handle case of multiple default group ids
                .single()
                .flatMap(userGroup -> {
                    if(userGroup.getName().startsWith(FieldName.ADMINISTRATOR) && userGroup.getUsers().size() == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                    return Mono.just(userGroup);
                })
                // If we cannot find the groups, that means either user is not part of any default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change userGroup of a member")));

        // Remove the user from the old group
        Mono<UserGroup> userGroupRemovedMono = oldDefaultUserGroupMono
                .zipWith(userMono)
                .flatMap(pair -> userGroupService.removeUser(pair.getT1(), pair.getT2()));

        // If new group id is not present, just remove the old group and return UserAndGroupDTO
        if(!StringUtils.hasText(changeUserGroupDTO.getNewGroupId())) {
            return userGroupRemovedMono.then(userMono)
                    .map(user ->UserAndGroupDTO.builder().username(user.getUsername()).name(user.getName()).build());
        }

        // Get the new group
        Mono<UserGroup> newDefaultUserGroupMono = Mono.zip(workspaceMono, userMono)
                .flatMap(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return userGroupService.getByIdAndDefaultWorkspaceId(user.getId(), workspace.getId(), AclPermission.INVITE_USER_GROUPS);
                })
                // If we cannot find the group, that means either newGroupId is not a default group or current user has no access to the group
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Change userGroup of a member")));

        // Add the user to the new group
        Mono<UserGroup> userGroupAddedMono = newDefaultUserGroupMono
                .zipWith(userMono)
                .flatMap(pair -> userGroupService.addUser(pair.getT1(), pair.getT2()));

        // Remove the old group, add the new group and then return UserAndGroupDTO
        return userGroupRemovedMono
                .then(userGroupAddedMono).zipWith(userMono)
                .map(pair -> {
                    User user = pair.getT2();
                    UserGroup newUserGroup = pair.getT1();
                    return UserAndGroupDTO.builder()
                        .username(user.getUsername())
                        .name(user.getName())
                        .groupName(newUserGroup.getName())
                        .groupId(newUserGroup.getId())
                        .build();
                });
    }

    @Override
    public Mono<List<UserAndGroupDTO>> getWorkspaceMembers(String workspaceId) {

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, AclPermission.READ_WORKSPACES);

        // Get default user group ids
        Mono<Set<String>> defaultUserGroups = workspaceMono
                .flatMap(workspace -> Mono.just(workspace.getDefaultUserGroups()));

        // Get default user groups
        Flux<UserGroup> userGroupFlux = defaultUserGroups
                .flatMapMany(userGroupIds -> userGroupService.getAllByIds(userGroupIds, AclPermission.READ_USER_GROUPS));

        // Create a list of UserAndGroupDTO from UserGroup list
        Mono<List<UserAndGroupDTO>> userAndGroupDTOsMono = userGroupFlux
                .collectList()
                .map(this::mapUserGroupListToUserAndGroupDTOList).cache();

        // Create a map of User.username to User
        Mono<Map<String, User>> userMapMono = userAndGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .map(UserAndGroupDTO::getUsername)
                .collect(Collectors.toSet())
                .flatMapMany(usernames -> userRepository.findAllByEmails(usernames))
                .collectMap(User::getUsername)
                .cache();

        // Update name in the list of UserAndGroupDTO
        userAndGroupDTOsMono = userAndGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .zipWith(userMapMono)
                .map(tuple -> {
                    UserAndGroupDTO userAndGroupDTO = tuple.getT1();
                    Map<String, User> userMap = tuple.getT2();
                    userAndGroupDTO.setName(userMap.get(userAndGroupDTO.getUsername()).getName()); // update name
                    return userAndGroupDTO;
                }).collectList().cache();

        return userAndGroupDTOsMono;
    }

    private List<UserAndGroupDTO> mapUserGroupListToUserAndGroupDTOList(List<UserGroup> userGroupList) {
        Set<UserInGroup> userInGroups = new HashSet<>(); // Set of already collected users
        List<UserAndGroupDTO> userAndGroupDTOList = new ArrayList<>();
        userGroupList.forEach(userGroup -> {
            userGroup.getUsers().stream().filter(userInGroup -> !userInGroups.contains(userInGroup)).forEach(userInGroup -> {
                userAndGroupDTOList.add(UserAndGroupDTO.builder()
                        .username(userInGroup.getUsername())
                        .groupName(userGroup.getName())
                        .groupId(userGroup.getId())
                        .build()); // collect user
                userInGroups.add(userInGroup); // update set of already collected users
            });
        });
        return userAndGroupDTOList;
    }
}
