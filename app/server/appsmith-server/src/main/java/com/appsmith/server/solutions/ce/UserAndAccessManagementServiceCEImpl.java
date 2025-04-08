package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserOrganizationHelper;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.EmailService;
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
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@Slf4j
public class UserAndAccessManagementServiceCEImpl implements UserAndAccessManagementServiceCE {

    private final SessionUserService sessionUserService;
    private final PermissionGroupService permissionGroupService;
    private final WorkspaceService workspaceService;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final UserService userService;
    private final PermissionGroupPermission permissionGroupPermission;
    private final EmailService emailService;
    private final UserOrganizationHelper userOrganizationHelper;

    private final CaptchaService captchaService;

    public UserAndAccessManagementServiceCEImpl(
            SessionUserService sessionUserService,
            PermissionGroupService permissionGroupService,
            WorkspaceService workspaceService,
            UserRepository userRepository,
            AnalyticsService analyticsService,
            UserService userService,
            PermissionGroupPermission permissionGroupPermission,
            EmailService emailService,
            CommonConfig commonConfig,
            UserOrganizationHelper userOrganizationHelper,
            CaptchaService captchaService) {

        this.sessionUserService = sessionUserService;
        this.permissionGroupService = permissionGroupService;
        this.workspaceService = workspaceService;
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
        this.userService = userService;
        this.emailService = emailService;
        this.permissionGroupPermission = permissionGroupPermission;
        this.userOrganizationHelper = userOrganizationHelper;
        this.captchaService = captchaService;
    }

    @Override
    public Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader, String captchaToken) {
        return captchaService.verify(captchaToken).flatMap(captchaVerified -> {
            if (TRUE.equals(captchaVerified)) {
                return inviteUsers(inviteUsersDTO, originHeader);
            } else {
                return Mono.error(new AppsmithException(AppsmithError.GOOGLE_RECAPTCHA_INVITE_FLOW_FAILED));
            }
        });
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

        Set<String> usernames = new HashSet<>();
        for (String username : originalUsernames) {
            if (!ValidationUtils.validateEmail(username)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAMES));
            }
            usernames.add(username.toLowerCase());
        }

        Map<String, Object> eventData = new HashMap<>();

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        // Check if the current user has assign permissions to the permission group and permission group is workspace's
        // default permission group.
        Mono<PermissionGroup> permissionGroupMono = permissionGroupService
                .getById(inviteUsersDTO.getPermissionGroupId(), permissionGroupPermission.getAssignPermission())
                .filter(permissionGroup ->
                        permissionGroup.getDefaultDomainType().equals(Workspace.class.getSimpleName())
                                && StringUtils.hasText(permissionGroup.getDefaultDomainId()))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ROLE, inviteUsersDTO.getPermissionGroupId())))
                .cache();

        // Get workspace from the default group.
        Mono<Workspace> workspaceMono = permissionGroupMono
                .flatMap(permissionGroup -> workspaceService.getById(permissionGroup.getDefaultDomainId()))
                .cache();

        // Get all the default permision groups of the workspace
        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceMono
                .flatMap(workspace -> permissionGroupService
                        .findAllByIds(workspace.getDefaultPermissionGroups())
                        .collectList())
                .cache();

        // Check if the invited user exists. If yes, return the user, else create a new user by triggering
        // createNewUserAndSendInviteEmail. In both the cases, send the appropriate emails
        Mono<List<Tuple2<User, Boolean>>> inviteUsersMonoWithUserCreationMapping = Flux.fromIterable(usernames)
                .flatMap(username -> Mono.zip(Mono.just(username), workspaceMono, defaultPermissionGroupsMono))
                .flatMap(tuple -> {
                    String username = tuple.getT1();
                    Workspace workspace = tuple.getT2();
                    eventData.put(FieldName.WORKSPACE, workspace);
                    List<PermissionGroup> defaultPermissionGroups = tuple.getT3();

                    Mono<User> getUserFromDbAndCheckIfUserExists = userOrganizationHelper
                            .getCurrentUserOrganizationId()
                            .flatMap(organizationId ->
                                    userRepository.findByEmailAndOrganizationId(username, organizationId))
                            .flatMap(user -> throwErrorIfUserAlreadyExistsInWorkspace(user, defaultPermissionGroups)
                                    .thenReturn(user));

                    return getUserFromDbAndCheckIfUserExists
                            .flatMap(existingUser -> Mono.just(Tuples.of(existingUser, false)))
                            .switchIfEmpty(Mono.defer(() -> {
                                User newUser = new User();
                                newUser.setEmail(username.toLowerCase());
                                newUser.setIsEnabled(false);
                                boolean isAdminUser = false;
                                return userService
                                        .userCreate(newUser, isAdminUser)
                                        .flatMap(newCreatedUser -> Mono.just(Tuples.of(newCreatedUser, true)));
                            }));
                })
                .collectList()
                .cache();

        Mono<List<User>> inviteUsersMono = inviteUsersMonoWithUserCreationMapping
                .map(tuple2s -> tuple2s.stream().map(Tuple2::getT1).collect(Collectors.toList()))
                .cache();

        // assign permission group to the invited users.
        Mono<PermissionGroup> bulkAddUserResultMono = Mono.zip(permissionGroupMono, inviteUsersMono)
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    return permissionGroupService.bulkAssignToUserAndSendEvent(permissionGroup, users);
                })
                .cache();

        // Send analytics event
        Mono<Object> sendAnalyticsEventMono = Mono.zip(currentUserMono, inviteUsersMono)
                .flatMap(tuple -> {
                    User currentUser = tuple.getT1();
                    List<User> users = tuple.getT2();
                    Map<String, Object> analyticsProperties = new HashMap<>();
                    long numberOfUsers = users.size();
                    List<String> invitedUsers =
                            users.stream().map(User::getEmail).collect(Collectors.toList());
                    analyticsProperties.put(FieldName.NUMBER_OF_USERS_INVITED, numberOfUsers);
                    eventData.put(FieldName.USER_EMAILS, invitedUsers);
                    Map<String, Object> extraPropsForCloudHostedInstance = Map.of(FieldName.USER_EMAILS, invitedUsers);
                    analyticsProperties.put(FieldName.EVENT_DATA, eventData);
                    analyticsProperties.put(FieldName.CLOUD_HOSTED_EXTRA_PROPS, extraPropsForCloudHostedInstance);
                    return analyticsService.sendObjectEvent(
                            AnalyticsEvents.EXECUTE_INVITE_USERS, currentUser, analyticsProperties);
                });

        Mono<Boolean> sendEmailsMono = Mono.zip(
                        inviteUsersMonoWithUserCreationMapping, workspaceMono, currentUserMono, permissionGroupMono)
                .flatMap(tuple -> {
                    List<Tuple2<User, Boolean>> users = tuple.getT1();
                    Workspace workspace = tuple.getT2();
                    User currentUser = tuple.getT3();
                    PermissionGroup permissionGroup = tuple.getT4();

                    return Flux.fromIterable(users)
                            .flatMap(userTuple -> {
                                User user = userTuple.getT1();
                                boolean isNewUser = userTuple.getT2();
                                return emailService.sendInviteUserToWorkspaceEmail(
                                        currentUser, user, workspace, permissionGroup, originHeader, isNewUser);
                            })
                            .all(emailSent -> emailSent);
                });

        return bulkAddUserResultMono
                .then(sendAnalyticsEventMono)
                .then(sendEmailsMono)
                .then(inviteUsersMono);
    }

    private Mono<Boolean> throwErrorIfUserAlreadyExistsInWorkspace(
            User user, List<PermissionGroup> defaultPermissionGroups) {

        return Flux.fromIterable(defaultPermissionGroups)
                .map(permissionGroup -> {
                    if (permissionGroup.getAssignedToUserIds().contains(user.getId())) {
                        throw new AppsmithException(
                                AppsmithError.USER_ALREADY_EXISTS_IN_WORKSPACE,
                                user.getUsername(),
                                permissionGroup.getName());
                    }
                    return TRUE;
                })
                .then(Mono.just(TRUE));
    }
}
