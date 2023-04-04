package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.PermissionGroupPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.services.ce.UserServiceCEImpl.INVITE_USER_EMAIL_TEMPLATE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class UserAndAccessManagementServiceCEImpl implements UserAndAccessManagementServiceCE {

    private final SessionUserService sessionUserService;
    private final PermissionGroupService permissionGroupService;
    private final WorkspaceService workspaceService;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final UserService userService;
    private final EmailSender emailSender;
    private final PermissionGroupPermission permissionGroupPermission;

    public UserAndAccessManagementServiceCEImpl(SessionUserService sessionUserService,
                                                PermissionGroupService permissionGroupService,
                                                WorkspaceService workspaceService,
                                                UserRepository userRepository,
                                                AnalyticsService analyticsService,
                                                UserService userService,
                                                EmailSender emailSender,
                                                PermissionGroupPermission permissionGroupPermission) {

        this.sessionUserService = sessionUserService;
        this.permissionGroupService = permissionGroupService;
        this.workspaceService = workspaceService;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
        this.userService = userService;
        this.emailSender = emailSender;
        this.permissionGroupPermission = permissionGroupPermission;
    }

    /**
     * 1. User doesn't exist :
     * a. Create a new user.
     * b. Set isEnabled to false
     * c. Generate a token. Send out an email informing the user to sign up with token.
     * d. Follow the steps for User which already exists
     * 2. User exists :
     * a. Add user to the workspace
     * b. Add workspace to the user
     *
     * @return Publishes the invited users, after being saved with the new workspace ID.
     */
    @Override
    public Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader) {

        if (originHeader == null || originHeader.isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        List<String> originalUsernames = inviteUsersDTO.getUsernames();

        if (CollectionUtils.isEmpty(originalUsernames)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAMES));
        }

        if (!StringUtils.hasText(inviteUsersDTO.getPermissionGroupId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ROLE));
        }

        List<String> usernames = new ArrayList<>();
        for (String username : originalUsernames) {
            usernames.add(username.toLowerCase());
        }

        Map<String, Object> eventData = new HashMap<>();

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        // Check if the current user has assign permissions to the permission group and permission group is workspace's default permission group.
        Mono<PermissionGroup> permissionGroupMono = permissionGroupService.getById(inviteUsersDTO.getPermissionGroupId(), permissionGroupPermission.getAssignPermission())
                .filter(permissionGroup -> permissionGroup.getDefaultDomainType().equals(Workspace.class.getSimpleName()) && StringUtils.hasText(permissionGroup.getDefaultDomainId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ROLE)))
                .cache();

        // Get workspace from the default group.
        Mono<Workspace> workspaceMono = permissionGroupMono.flatMap(permissionGroup -> workspaceService.getById(permissionGroup.getDefaultDomainId())).cache();

        // Get all the default permision groups of the workspace
        Mono<List<PermissionGroup>> defaultPermissionGroupsMono =
                workspaceMono.flatMap(workspace ->
                        permissionGroupService.findAllByIds(workspace.getDefaultPermissionGroups())
                                .collectList()
                ).cache();

        // Check if the invited user exists. If yes, return the user, else create a new user by triggering
        // createNewUserAndSendInviteEmail. In both the cases, send the appropriate emails
        Mono<List<User>> inviteUsersMono = Flux.fromIterable(usernames)
                .flatMap(username -> Mono.zip(Mono.just(username), workspaceMono, currentUserMono, permissionGroupMono, defaultPermissionGroupsMono))
                .flatMap(tuple -> {
                    String username = tuple.getT1();
                    Workspace workspace = tuple.getT2();
                    eventData.put(FieldName.WORKSPACE, workspace);
                    User currentUser = tuple.getT3();
                    PermissionGroup permissionGroup = tuple.getT4();
                    List<PermissionGroup> defaultPermissionGroups = tuple.getT5();

                    Mono<User> getUserFromDbAndCheckIfUserExists = userRepository.findByEmail(username)
                            .flatMap(user -> {
                                return throwErrorIfUserAlreadyExistsInWorkspace(user, defaultPermissionGroups)
                                        // If no errors, proceed forward
                                        .thenReturn(user);
                            });

                    return getUserFromDbAndCheckIfUserExists
                            .flatMap(existingUser -> {
                                // The user already existed, just send an email informing that the user has been added
                                // to a new workspace
                                log.debug("Going to send email to user {} informing that the user has been added to new workspace {}",
                                        existingUser.getEmail(), workspace.getName());

                                // Email template parameters initialization below.
                                Map<String, String> params = userService.getEmailParams(workspace, currentUser, originHeader, false);

                                return userService.updateTenantLogoInParams(params, originHeader)
                                        .flatMap(updatedParams ->
                                                emailSender.sendMail(
                                                        existingUser.getEmail(),
                                                        "Appsmith: You have been added to a new workspace",
                                                        INVITE_USER_EMAIL_TEMPLATE,
                                                        updatedParams
                                                )
                                        )
                                        .thenReturn(existingUser);
                            })
                            .switchIfEmpty(userService.createNewUserAndSendInviteEmail(username, originHeader, workspace, currentUser, permissionGroup.getName()));
                })
                .collectList()
                .cache();

        // assign permission group to the invited users.
        Mono<PermissionGroup> bulkAddUserResultMono = Mono.zip(permissionGroupMono, inviteUsersMono)
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    return permissionGroupService.bulkAssignToUsers(permissionGroup, users);
                }).cache();

        // Send analytics event
        Mono<Object> sendAnalyticsEventMono = Mono.zip(currentUserMono, inviteUsersMono)
                .flatMap(tuple -> {
                    User currentUser = tuple.getT1();
                    List<User> users = tuple.getT2();
                    Map<String, Object> analyticsProperties = new HashMap<>();
                    long numberOfUsers = users.size();
                    List<String> invitedUsers = users.stream().map(User::getEmail).collect(Collectors.toList());
                    analyticsProperties.put(FieldName.NUMBER_OF_USERS_INVITED, numberOfUsers);
                    eventData.put(FieldName.USER_EMAILS, invitedUsers);
                    Map<String, Object> extraPropsForCloudHostedInstance = Map.of(FieldName.USER_EMAILS, invitedUsers);
                    analyticsProperties.put(FieldName.EVENT_DATA, eventData);
                    analyticsProperties.put(FieldName.CLOUD_HOSTED_EXTRA_PROPS, extraPropsForCloudHostedInstance);
                    return analyticsService.sendObjectEvent(AnalyticsEvents.EXECUTE_INVITE_USERS, currentUser, analyticsProperties);
                });

        return bulkAddUserResultMono.then(sendAnalyticsEventMono).then(inviteUsersMono);
    }

    private Mono<Boolean> throwErrorIfUserAlreadyExistsInWorkspace(User user,
                                                                   List<PermissionGroup> defaultPermissionGroups) {

        return Flux.fromIterable(defaultPermissionGroups)
                .map(permissionGroup -> {
                    if (permissionGroup.getAssignedToUserIds().contains(user.getId())) {
                        throw new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_IN_WORKSPACE, user.getUsername(), permissionGroup.getName());
                    }
                    return TRUE;
                })
                .then(Mono.just(TRUE));
    }

}
