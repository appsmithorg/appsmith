package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.EmailTokenDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserChangedHandler;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.message.BasicNameValuePair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static java.lang.Boolean.TRUE;

@Slf4j
public class UserServiceCEImpl extends BaseService<UserRepository, User, String> implements UserServiceCE {

    private final WorkspaceService workspaceService;
    private final SessionUserService sessionUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final ApplicationRepository applicationRepository;
    private final PolicyUtils policyUtils;
    private final CommonConfig commonConfig;
    private final EmailConfig emailConfig;
    private final UserChangedHandler userChangedHandler;
    private final EncryptionService encryptionService;
    private final UserDataService userDataService;
    private final TenantService tenantService;
    private final PermissionGroupService permissionGroupService;
    private final UserUtils userUtils;

    private static final String WELCOME_USER_EMAIL_TEMPLATE = "email/welcomeUserTemplate.html";
    private static final String FORGOT_PASSWORD_EMAIL_TEMPLATE = "email/forgotPasswordTemplate.html";
    private static final String FORGOT_PASSWORD_CLIENT_URL_FORMAT = "%s/user/resetPassword?token=%s";
    private static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?email=%s";
    public static final String INVITE_USER_EMAIL_TEMPLATE = "email/inviteUserTemplate.html";

    @Autowired
    public UserServiceCEImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             UserRepository repository,
                             WorkspaceService workspaceService,
                             AnalyticsService analyticsService,
                             SessionUserService sessionUserService,
                             PasswordResetTokenRepository passwordResetTokenRepository,
                             PasswordEncoder passwordEncoder,
                             EmailSender emailSender,
                             ApplicationRepository applicationRepository,
                             PolicyUtils policyUtils,
                             CommonConfig commonConfig,
                             EmailConfig emailConfig,
                             UserChangedHandler userChangedHandler,
                             EncryptionService encryptionService,
                             UserDataService userDataService,
                             TenantService tenantService,
                             PermissionGroupService permissionGroupService,
                             UserUtils userUtils) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.workspaceService = workspaceService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.applicationRepository = applicationRepository;
        this.policyUtils = policyUtils;
        this.commonConfig = commonConfig;
        this.emailConfig = emailConfig;
        this.userChangedHandler = userChangedHandler;
        this.encryptionService = encryptionService;
        this.userDataService = userDataService;
        this.tenantService = tenantService;
        this.permissionGroupService = permissionGroupService;
        this.userUtils = userUtils;
    }

    @Override
    public Mono<User> findByEmail(String email) {
        return tenantService.getDefaultTenantId()
                .flatMap(tenantId -> findByEmailAndTenantId(email, tenantId));
    }

    @Override
    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        return repository.findByEmailAndTenantId(email, tenantId);
    }

    /**
     * This function switches the user's currentWorkspace in the User collection in the DB. This means that on subsequent
     * logins, the user will see applications for their last used workspace.
     *
     * @param workspaceId
     * @return
     */
    @Override
    public Mono<User> switchCurrentWorkspace(String workspaceId) {
        if (workspaceId == null || workspaceId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "workspaceId"));
        }
        return sessionUserService.getCurrentUser()
                .flatMap(user -> repository.findByEmail(user.getUsername()))
                .flatMap(user -> {
                    log.debug("Going to set workspaceId: {} for user: {}", workspaceId, user.getId());

                    if (user.getCurrentWorkspaceId().equals(workspaceId)) {
                        return Mono.just(user);
                    }

                    Set<String> workspaceIds = user.getWorkspaceIds();
                    if (workspaceIds == null || workspaceIds.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_DOESNT_BELONG_ANY_WORKSPACE, user.getId()));
                    }

                    Optional<String> maybeWorkspaceId = workspaceIds.stream()
                            .filter(workspaceId1 -> workspaceId1.equals(workspaceId))
                            .findFirst();

                    if (maybeWorkspaceId.isPresent()) {
                        user.setCurrentWorkspaceId(maybeWorkspaceId.get());
                        return repository.save(user);
                    }

                    // Throw an exception if the workspaceId is not part of the user's workspaces
                    return Mono.error(new AppsmithException(AppsmithError.USER_DOESNT_BELONG_TO_WORKSPACE, user.getId(), workspaceId));
                });
    }


    /**
     * This function creates a one-time token for resetting the user's password. This token is stored in the `passwordResetToken`
     * collection with an expiry time of 48 hours. The user must provide this one-time token when updating with the new password.
     *
     * @param resetUserPasswordDTO DTO object containing the request params from form
     * @return True if email is sent successfully
     */
    @Override
    public Mono<Boolean> forgotPasswordTokenGenerate(ResetUserPasswordDTO resetUserPasswordDTO) {
        if (resetUserPasswordDTO.getEmail() == null
                || resetUserPasswordDTO.getEmail().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.EMAIL));
        }

        if (resetUserPasswordDTO.getBaseUrl() == null || resetUserPasswordDTO.getBaseUrl().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        String email = resetUserPasswordDTO.getEmail();

        // Create a random token to be sent out.
        final String token = UUID.randomUUID().toString();

        // Check if the user exists in our DB. If not, we will not send a password reset link to the user
        return repository.findByEmail(email)
                .switchIfEmpty(repository.findByCaseInsensitiveEmail(email))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)))
                .flatMap(user -> {
                    // an user found with the provided email address
                    // Generate the password reset link for the user
                    return passwordResetTokenRepository.findByEmail(user.getEmail())
                            .switchIfEmpty(Mono.defer(() -> {
                                PasswordResetToken passwordResetToken = new PasswordResetToken();
                                passwordResetToken.setEmail(user.getEmail());
                                passwordResetToken.setRequestCount(0);
                                passwordResetToken.setFirstRequestTime(Instant.now());
                                return Mono.just(passwordResetToken);
                            }))
                            .map(resetToken -> {
                                // check the validity of the token
                                validateResetLimit(resetToken);
                                resetToken.setTokenHash(passwordEncoder.encode(token));
                                return resetToken;
                            });
                })
                .flatMap(passwordResetTokenRepository::save)
                .flatMap(passwordResetToken -> {
                    log.debug("Password reset Token: {} for email: {}", token, passwordResetToken.getEmail());

                    List<NameValuePair> nameValuePairs = new ArrayList<>(2);
                    nameValuePairs.add(new BasicNameValuePair("email", passwordResetToken.getEmail()));
                    nameValuePairs.add(new BasicNameValuePair("token", token));
                    String urlParams = URLEncodedUtils.format(nameValuePairs, StandardCharsets.UTF_8);
                    String resetUrl = String.format(
                            FORGOT_PASSWORD_CLIENT_URL_FORMAT,
                            resetUserPasswordDTO.getBaseUrl(),
                            encryptionService.encryptString(urlParams)
                    );

                    log.debug("Password reset url for email: {}: {}", passwordResetToken.getEmail(), resetUrl);

                    Map<String, String> params = new HashMap<>();
                    params.put("resetUrl", resetUrl);

                    return updateTenantLogoInParams(params, resetUserPasswordDTO.getBaseUrl())
                            .flatMap(updatedParams ->
                                    emailSender.sendMail(email, "Appsmith Password Reset", FORGOT_PASSWORD_EMAIL_TEMPLATE, updatedParams)
                            );
                })
                .thenReturn(true);
    }

    /**
     * This method checks whether the reset request limit has been exceeded.
     * If the limit has been exceeded, it raises an Exception.
     * Otherwise, it'll update the counter and date in the resetToken object
     *
     * @param resetToken {@link PasswordResetToken}
     */
    private void validateResetLimit(PasswordResetToken resetToken) {
        if (resetToken.getRequestCount() >= 3) {
            Duration duration = Duration.between(resetToken.getFirstRequestTime(), Instant.now());
            long l = duration.toHours();
            if (l >= 24) { // ok, reset the counter
                resetToken.setRequestCount(1);
                resetToken.setFirstRequestTime(Instant.now());
            } else { // too many requests, raise an exception
                throw new AppsmithException(AppsmithError.TOO_MANY_REQUESTS);
            }
        } else {
            resetToken.setRequestCount(resetToken.getRequestCount() + 1);
            if (resetToken.getFirstRequestTime() == null) {
                resetToken.setFirstRequestTime(Instant.now());
            }
        }
    }

    /**
     * This function verifies if the password reset token and email match each other. Should be initiated after the
     * user has already initiated a password reset request via the 'Forgot Password' link. The tokens are stored in the
     * DB using BCrypt hash.
     *
     * @param encryptedToken The one-time token provided to the user for resetting the password
     * @return Publishes a boolean indicating whether the given token is valid for the given email address
     */
    @Override
    public Mono<Boolean> verifyPasswordResetToken(String encryptedToken) {
        EmailTokenDTO emailTokenDTO;
        try {
            emailTokenDTO = parseValueFromEncryptedToken(encryptedToken);
        } catch (ArrayIndexOutOfBoundsException | IllegalStateException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.TOKEN));
        }

        return passwordResetTokenRepository
                .findByEmail(emailTokenDTO.getEmail())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PASSWORD_RESET)))
                .map(obj -> this.passwordEncoder.matches(emailTokenDTO.getToken(), obj.getTokenHash()));
    }

    /**
     * This function resets the password using the one-time token & email of the user.
     * This function can only be called via the forgot password route.
     *
     * @param encryptedToken The one-time token provided to the user for resetting the password
     * @param user           The user object that contains the email & password fields in order to save the new password for the user
     * @return
     */
    @Override
    public Mono<Boolean> resetPasswordAfterForgotPassword(String encryptedToken, User user) {
        EmailTokenDTO emailTokenDTO;
        try {
            emailTokenDTO = parseValueFromEncryptedToken(encryptedToken);
        } catch (ArrayIndexOutOfBoundsException | IllegalStateException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.TOKEN));
        }

        return passwordResetTokenRepository
                .findByEmail(emailTokenDTO.getEmail())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PASSWORD_RESET)))
                .map(passwordResetToken -> {
                    boolean matches = this.passwordEncoder.matches(emailTokenDTO.getToken(), passwordResetToken.getTokenHash());
                    if (!matches) {
                        throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, FieldName.TOKEN);
                    } else {
                        return emailTokenDTO.getEmail();
                    }
                })
                .flatMap(emailAddress -> repository
                        .findByEmail(emailAddress)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, emailAddress)))
                        .flatMap(userFromDb -> {
                            if (!ValidationUtils.validateLoginPassword(user.getPassword())) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.INVALID_PASSWORD_LENGTH, LOGIN_PASSWORD_MIN_LENGTH, LOGIN_PASSWORD_MAX_LENGTH)
                                );
                            }

                            //User has verified via the forgot password token verfication route. Allow the user to set new password.
                            userFromDb.setPasswordResetInitiated(false);
                            userFromDb.setPassword(passwordEncoder.encode(user.getPassword()));

                            // If the user has been invited but has not signed up yet, and is following the route of reset
                            // password flow to set up their password, enable the user's account as well
                            userFromDb.setIsEnabled(true);

                            return passwordResetTokenRepository
                                    .findByEmail(userFromDb.getEmail())
                                    .switchIfEmpty(Mono.error(new AppsmithException(
                                            AppsmithError.NO_RESOURCE_FOUND, FieldName.TOKEN, emailTokenDTO.getToken()
                                    )))
                                    .flatMap(passwordResetTokenRepository::delete)
                                    .then(repository.save(userFromDb))
                                    .doOnSuccess(result ->
                                            // In a separate thread, we delete all other sessions of this user.
                                            sessionUserService.logoutAllSessions(userFromDb.getEmail())
                                                    .subscribeOn(Schedulers.boundedElastic())
                                                    .subscribe()
                                    )
                                    .thenReturn(true);
                        }));
    }

    @Override
    public Mono<User> create(User user) {
        // This is the path that is taken when a new user signs up on its own
        return createUserAndSendEmail(user, null).map(UserSignupDTO::getUser);
    }


    @Override
    public Mono<User> userCreate(User user, boolean isAdminUser) {
        // It is assumed here that the user's password has already been encoded.

        // convert the user email to lowercase
        user.setEmail(user.getEmail().toLowerCase());

        Mono<User> userWithTenantMono = Mono.just(user)
                .flatMap(userBeforeSave -> {
                    if (userBeforeSave.getTenantId() == null) {
                        return tenantService.getDefaultTenantId()
                                .map(tenantId -> {
                                    userBeforeSave.setTenantId(tenantId);
                                    return userBeforeSave;
                                });
                    }
                    // The tenant has been set already. No need to set the default tenant id.
                    return Mono.just(userBeforeSave);
                });

        // Save the new user
        return userWithTenantMono
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .flatMap(savedUser -> addUserPolicies(savedUser, isAdminUser))
                .then(Mono.zip(
                        repository.findByEmail(user.getUsername()),
                        userDataService.getForUserEmail(user.getUsername())
                ))
                .flatMap(tuple -> analyticsService.identifyUser(tuple.getT1(), tuple.getT2()));
    }

    private Mono<User> addUserPolicies(User savedUser, Boolean isAdminUser) {

        // Create user management permission group
        PermissionGroup userManagementPermissionGroup = new PermissionGroup();
        userManagementPermissionGroup.setName(savedUser.getUsername() + " User Management");
        // Add CRUD permissions for user to the group
        userManagementPermissionGroup.setPermissions(
                Set.of(
                        new Permission(savedUser.getId(), MANAGE_USERS)
                )
        );

        // Assign the permission group to the user
        userManagementPermissionGroup.setAssignedToUserIds(Set.of(savedUser.getId()));

        return permissionGroupService.save(userManagementPermissionGroup)
                .flatMap(savedPermissionGroup -> {

                    Map<String, Policy> crudUserPolicies = policyUtils.generatePolicyFromPermissionGroupForObject(savedPermissionGroup,
                            savedUser.getId());

                    User updatedWithPolicies = policyUtils.addPoliciesToExistingObject(crudUserPolicies, savedUser);

                    return repository.save(updatedWithPolicies);
                })
                .flatMap(crudUser -> {
                    if (isAdminUser) {
                        return userUtils.makeSuperUser(List.of(crudUser))
                                .then(Mono.just(crudUser));
                    }
                    return Mono.just(crudUser);
                });
    }

    /**
     * This function creates a new user in the system. Primarily used by new users signing up for the first time on the
     * platform. This flow also ensures that a default workspace name is created for the user. The new user is then
     * given admin permissions to the default workspace.
     * <p>
     * For new user invite flow, please {@link com.appsmith.server.solutions.UserAndAccessManagementService#inviteUsers(InviteUsersDTO, String)}
     *
     * @param user User object representing the user to be created/enabled.
     * @return Publishes the user object, after having been saved.
     */
    @Override
    public Mono<UserSignupDTO> createUserAndSendEmail(User user, String originHeader) {

        if (originHeader == null || originHeader.isBlank()) {
            // Default to the production link
            originHeader = Appsmith.DEFAULT_ORIGIN_HEADER;
        }

        final String finalOriginHeader = originHeader;

        // Only encode the password if it's a form signup. For OAuth signups, we don't need password
        if (LoginSource.FORM.equals(user.getSource())) {
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS));
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // If the user doesn't exist, create the user. If the user exists, return a duplicate key exception
        return repository.findByCaseInsensitiveEmail(user.getUsername())
                .flatMap(savedUser -> {
                    if (!savedUser.isEnabled()) {
                        // First enable the user
                        savedUser.setIsEnabled(true);
                        savedUser.setSource(user.getSource());
                        // In case of form login, store the encrypted password.
                        savedUser.setPassword(user.getPassword());
                        return repository.save(savedUser).map(updatedUser -> {
                            UserSignupDTO userSignupDTO = new UserSignupDTO();
                            userSignupDTO.setUser(updatedUser);
                            return userSignupDTO;
                        });
                    }
                    return Mono.error(new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_SIGNUP, savedUser.getUsername()));
                })
                .switchIfEmpty(Mono.defer(() -> {
                    return signupIfAllowed(user)
                            .flatMap(savedUser -> {
                                final UserSignupDTO userSignupDTO = new UserSignupDTO();
                                userSignupDTO.setUser(savedUser);

                                return workspaceService.createDefault(new Workspace(), savedUser)
                                        .map(workspace -> {
                                            log.debug("Created blank default workspace for user '{}'.", savedUser.getEmail());
                                            userSignupDTO.setDefaultWorkspaceId(workspace.getId());
                                            return userSignupDTO;
                                        })
                                        .onErrorResume(e -> {
                                            log.debug("Error creating default workspace for user '{}'.", savedUser.getEmail(), e);
                                            return Mono.just(userSignupDTO);
                                        });
                            })
                            .flatMap(userSignupDTO -> findByEmail(userSignupDTO.getUser().getEmail()).map(user1 -> {
                                userSignupDTO.setUser(user1);
                                return userSignupDTO;
                            }));
                }))
                .flatMap(userSignupDTO -> {
                            User savedUser = userSignupDTO.getUser();
                            Mono<User> userMono = emailConfig.isWelcomeEmailEnabled()
                                    ? sendWelcomeEmail(savedUser, finalOriginHeader)
                                    : Mono.just(savedUser);
                            return userMono.thenReturn(userSignupDTO);
                        }

                );
    }

    private Mono<User> signupIfAllowed(User user) {
        boolean isAdminUser = false;

        if (!commonConfig.getAdminEmails().contains(user.getEmail())) {
            // If this is not an admin email address, only then do we check if signup should be allowed or not. Being an
            // explicitly set admin email address trumps all everything and signup for this email can never be disabled.

            if (commonConfig.isSignupDisabled()) {
                // Signing up has been globally disabled. Reject.
                return Mono.error(new AppsmithException(AppsmithError.SIGNUP_DISABLED, user.getUsername()));
            }

            final List<String> allowedDomains = user.getSource() == LoginSource.FORM
                    ? commonConfig.getAllowedDomains()
                    : commonConfig.getOauthAllowedDomains();
            if (!CollectionUtils.isEmpty(allowedDomains)
                    && StringUtils.hasText(user.getEmail())
                    && user.getEmail().contains("@")
                    && !allowedDomains.contains(user.getEmail().split("@")[1])) {
                // There is an explicit whitelist of email address domains that should be allowed. If the new email is
                // of a different domain, reject.
                return Mono.error(new AppsmithException(AppsmithError.SIGNUP_DISABLED, user.getUsername()));
            }
        } else {
            isAdminUser = true;
        }

        // No special configurations found, allow signup for the new user.
        return userCreate(user, isAdminUser);
    }

    public Mono<User> sendWelcomeEmail(User user, String originHeader) {
        Map<String, String> params = new HashMap<>();
        params.put("primaryLinkUrl", originHeader);

        return updateTenantLogoInParams(params, originHeader)
                .flatMap(updatedParams -> emailSender.sendMail(
                        user.getEmail(),
                        "Welcome to Appsmith",
                        WELCOME_USER_EMAIL_TEMPLATE,
                        updatedParams))
                .onErrorResume(error -> {
                    // Swallowing this exception because we don't want this to affect the rest of the flow.
                    log.error(
                            "Ignoring error: Unable to send welcome email to the user {}. Cause: ",
                            user.getEmail(),
                            Exceptions.unwrap(error)
                    );
                    return Mono.just(TRUE);
                })
                .thenReturn(user);
    }

    @Override
    public Mono<User> update(String id, User userUpdate) {
        Mono<User> userFromRepository = repository.findById(id, MANAGE_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, id)));

        return userFromRepository
                .flatMap(existingUser -> this.update(existingUser, userUpdate));
    }

    /**
     * Method to update user without ACL permission. This will be used internally to update the user
     * @param id        UserId which needs to be updated
     * @param update    User object
     * @return          Updated user
     */
    @Override
    public Mono<User> updateWithoutPermission(String id, User update) {
        Mono<User> userFromRepository = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, id)));

        return userFromRepository
                .flatMap(existingUser -> this.update(existingUser, update));
    }

    private Mono<User> update(User existingUser, User userUpdate) {

        // The password is being updated. Hash it first and then store it
        if (userUpdate.getPassword() != null) {
            userUpdate.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }

        AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(userUpdate, existingUser);
        return repository.save(existingUser)
                .map(userChangedHandler::publish);
    }

    @Override
    public Mono<? extends User> createNewUserAndSendInviteEmail(String email, String originHeader,
                                                                Workspace workspace, User inviter, String role) {
        User newUser = new User();
        newUser.setEmail(email.toLowerCase());

        // This is a new user. Till the user signs up, this user would be disabled.
        newUser.setIsEnabled(false);

        // The invite token is not used today and doesn't need to be verified. We still save the invite token with the
        // role information to classify the user persona.
        newUser.setInviteToken(role + ":" + UUID.randomUUID());

        boolean isAdminUser = commonConfig.getAdminEmails().contains(email.toLowerCase());

        // Call user service's userCreate function so that the default workspace, etc are also created along with assigning basic permissions.
        return userCreate(newUser, isAdminUser)
                .flatMap(createdUser -> {
                    log.debug("Going to send email for invite user to {}", createdUser.getEmail());
                    String inviteUrl = String.format(
                            INVITE_USER_CLIENT_URL_FORMAT,
                            originHeader,
                            URLEncoder.encode(createdUser.getEmail(), StandardCharsets.UTF_8)
                    );

                    // Email template parameters initialization below.
                    Map<String, String> params = getEmailParams(workspace, inviter, inviteUrl, true);

                    // We have sent out the emails. Just send back the saved user.
                    return updateTenantLogoInParams(params, originHeader)
                            .flatMap(updatedParams ->
                                    emailSender.sendMail(createdUser.getEmail(), "Invite for Appsmith", INVITE_USER_EMAIL_TEMPLATE, updatedParams)
                            )
                            .thenReturn(createdUser);
                });
    }

    @Override
    public Flux<User> get(MultiValueMap<String, String> params) {
        // Get All Users should not be supported. Return an error
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<User> updateCurrentUser(final UserUpdateDTO allUpdates, ServerWebExchange exchange) {
        List<Mono<Void>> monos = new ArrayList<>();

        Mono<User> updatedUserMono;
        Mono<UserData> updatedUserDataMono;

        if (allUpdates.hasUserUpdates()) {
            final User updates = new User();
            updates.setName(allUpdates.getName());
            updatedUserMono = sessionUserService.getCurrentUser()
                    .flatMap(user ->
                            update(user.getEmail(), updates, fieldName(QUser.user.email))
                                    .then(exchange == null
                                            ? repository.findByEmail(user.getEmail())
                                            : sessionUserService.refreshCurrentUser(exchange))
                    )
                    .map(userChangedHandler::publish)
                    .cache();
            monos.add(updatedUserMono.then());
        } else {
            updatedUserMono = sessionUserService.getCurrentUser()
                    .flatMap(user -> findByEmail(user.getEmail()));
        }

        if (allUpdates.hasUserDataUpdates()) {
            final UserData updates = new UserData();
            updates.setRole(allUpdates.getRole());
            updates.setUseCase(allUpdates.getUseCase());
            updatedUserDataMono = userDataService.updateForCurrentUser(updates).cache();
            monos.add(updatedUserDataMono.then());
        } else {
            updatedUserDataMono = userDataService.getForCurrentUser();
        }

        return Mono.whenDelayError(monos)
                .then(Mono.zip(updatedUserMono, updatedUserDataMono))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    return analyticsService.identifyUser(user, userData).thenReturn(user);
                });
    }

    @Override
    public Map<String, String> getEmailParams(Workspace workspace, User inviter, String inviteUrl, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();

        if (inviter != null) {
            params.put("inviterFirstName", org.apache.commons.lang3.StringUtils.defaultIfEmpty(inviter.getName(), inviter.getEmail()));
        }
        if (workspace != null) {
            params.put("inviterWorkspaceName", workspace.getName());
        }
        if (isNewUser) {
            params.put("primaryLinkUrl", inviteUrl);
            params.put("primaryLinkText", "Sign up now");
        } else {
            if (workspace != null) {
                params.put("primaryLinkUrl", inviteUrl + "/applications#" + workspace.getId());
            }
            params.put("primaryLinkText", "Go to workspace");
        }
        return params;
    }

    @Override
    public Mono<Boolean> isUsersEmpty() {
        return repository.isUsersEmpty();
    }

    @Override
    public Mono<UserProfileDTO> buildUserProfileDTO(User user) {

        Mono<User> userFromDbMono = findByEmail(user.getEmail())
                .cache();

        Mono<Boolean> isSuperUserMono = userFromDbMono
                .flatMap(userUtils::isSuperUser);

        return Mono.zip(
                        isUsersEmpty(),
                        userFromDbMono,
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData()),
                        isSuperUserMono
                )
                .map(tuple -> {
                    final boolean isUsersEmpty = Boolean.TRUE.equals(tuple.getT1());
                    final User userFromDb = tuple.getT2();
                    final UserData userData = tuple.getT3();
                    Boolean isSuperUser = tuple.getT4();

                    final UserProfileDTO profile = new UserProfileDTO();

                    profile.setEmail(userFromDb.getEmail());
                    profile.setWorkspaceIds(userFromDb.getWorkspaceIds());
                    profile.setUsername(userFromDb.getUsername());
                    profile.setName(userFromDb.getName());
                    profile.setGender(userFromDb.getGender());
                    profile.setEmptyInstance(isUsersEmpty);
                    profile.setAnonymous(userFromDb.isAnonymous());
                    profile.setEnabled(userFromDb.isEnabled());
                    profile.setRole(userData.getRole());
                    profile.setUseCase(userData.getUseCase());
                    profile.setPhotoId(userData.getProfilePhotoAssetId());
                    profile.setEnableTelemetry(!commonConfig.isTelemetryDisabled());

                    profile.setSuperUser(isSuperUser);
                    profile.setConfigurable(!StringUtils.isEmpty(commonConfig.getEnvFilePath()));

                    return profile;
                });
    }

    private EmailTokenDTO parseValueFromEncryptedToken(String encryptedToken) {
        String decryptString = encryptionService.decryptString(encryptedToken);
        List<NameValuePair> nameValuePairs = URLEncodedUtils.parse(decryptString, StandardCharsets.UTF_8);
        Map<String, String> params = new HashMap<>();

        for (NameValuePair nameValuePair : nameValuePairs) {
            params.put(nameValuePair.getName(), nameValuePair.getValue());
        }
        return new EmailTokenDTO(params.get("email"), params.get("token"));
    }

    @Override
    public Flux<User> getAllByEmails(Set<String> emails, AclPermission permission) {
        return repository.findAllByEmails(emails);
    }

    @Override
    public Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin) {
        return Mono.just(params);
    }
}
