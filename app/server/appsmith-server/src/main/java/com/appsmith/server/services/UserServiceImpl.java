package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.BeanCopyUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;

@Slf4j
@Service
public class UserServiceImpl extends BaseService<UserRepository, User, String> implements UserService {

    private final OrganizationService organizationService;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final ApplicationRepository applicationRepository;
    private final PolicyUtils policyUtils;
    private final OrganizationRepository organizationRepository;
    private final UserOrganizationService userOrganizationService;
    private final RoleGraph roleGraph;
    private final ConfigService configService;

    private static final String WELCOME_USER_EMAIL_TEMPLATE = "email/welcomeUserTemplate.html";
    private static final String FORGOT_PASSWORD_EMAIL_TEMPLATE = "email/forgotPasswordTemplate.html";
    private static final String FORGOT_PASSWORD_CLIENT_URL_FORMAT = "%s/user/resetPassword?token=%s&email=%s";
    private static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?token=%s&email=%s";
    private static final String INVITE_USER_EMAIL_TEMPLATE = "email/inviteUserCreatorTemplate.html";
    private static final String USER_ADDED_TO_ORGANIZATION_EMAIL_TEMPLATE = "email/inviteExistingUserToOrganizationTemplate.html";
    // We default the origin header to the production deployment of the client's URL
    private static final String DEFAULT_ORIGIN_HEADER = "https://app.appsmith.com";

    @Autowired
    public UserServiceImpl(Scheduler scheduler,
                           Validator validator,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           UserRepository repository,
                           OrganizationService organizationService,
                           AnalyticsService analyticsService,
                           SessionUserService sessionUserService,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           PasswordEncoder passwordEncoder,
                           EmailSender emailSender,
                           ApplicationRepository applicationRepository,
                           PolicyUtils policyUtils,
                           OrganizationRepository organizationRepository,
                           UserOrganizationService userOrganizationService,
                           RoleGraph roleGraph,
                           ConfigService configService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.organizationService = organizationService;
        this.analyticsService = analyticsService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.applicationRepository = applicationRepository;
        this.policyUtils = policyUtils;
        this.organizationRepository = organizationRepository;
        this.userOrganizationService = userOrganizationService;
        this.roleGraph = roleGraph;
        this.configService = configService;
    }

    @Override
    public Mono<User> findByEmail(String email) {
        return repository.findByEmail(email);
    }

    /**
     * This function switches the user's currentOrganization in the User collection in the DB. This means that on subsequent
     * logins, the user will see applications for their last used organization.
     *
     * @param orgId
     * @return
     */
    @Override
    public Mono<User> switchCurrentOrganization(String orgId) {
        if (orgId == null || orgId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "organizationId"));
        }
        return sessionUserService.getCurrentUser()
                .flatMap(user -> repository.findByEmail(user.getUsername()))
                .flatMap(user -> {
                    log.debug("Going to set organizationId: {} for user: {}", orgId, user.getId());

                    if (user.getCurrentOrganizationId().equals(orgId)) {
                        return Mono.just(user);
                    }

                    Set<String> organizationIds = user.getOrganizationIds();
                    if (organizationIds == null || organizationIds.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_DOESNT_BELONG_ANY_ORGANIZATION, user.getId()));
                    }

                    Optional<String> maybeOrgId = organizationIds.stream()
                            .filter(organizationId -> organizationId.equals(orgId))
                            .findFirst();

                    if (maybeOrgId.isPresent()) {
                        user.setCurrentOrganizationId(maybeOrgId.get());
                        return repository.save(user);
                    }

                    // Throw an exception if the orgId is not part of the user's organizations
                    return Mono.error(new AppsmithException(AppsmithError.USER_DOESNT_BELONG_TO_ORGANIZATION, user.getId(), orgId));
                });
    }


    /**
     * This function creates a one-time token for resetting the user's password. This token is stored in the `passwordResetToken`
     * collection with an expiry time of 1 hour. The user must provide this one-time token when updating with the new password.
     *
     * @param resetUserPasswordDTO
     * @return
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
        String token = UUID.randomUUID().toString();
        log.debug("Password reset Token: {} for email: {}", token, email);

        // Check if the user exists in our DB. If not, we will not send a password reset link to the user
        Mono<User> userMono = repository.findByEmail(email)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)));

        // Generate the password reset link for the user
        Mono<PasswordResetToken> passwordResetTokenMono = passwordResetTokenRepository.findByEmail(email)
                .switchIfEmpty(Mono.defer(() -> {
                    PasswordResetToken passwordResetToken = new PasswordResetToken();
                    passwordResetToken.setEmail(email);
                    return Mono.just(passwordResetToken);
                }))
                .map(resetToken -> {
                    resetToken.setTokenHash(passwordEncoder.encode(token));
                    return resetToken;
                });

        // Save the password reset link and send an email to the user
        Mono<Boolean> resetFlowMono = passwordResetTokenMono
                .flatMap(passwordResetTokenRepository::save)
                .flatMap(obj -> {
                    String resetUrl = String.format(
                            FORGOT_PASSWORD_CLIENT_URL_FORMAT,
                            resetUserPasswordDTO.getBaseUrl(),
                            URLEncoder.encode(token, StandardCharsets.UTF_8),
                            URLEncoder.encode(email, StandardCharsets.UTF_8)
                    );

                    Map<String, String> params = Map.of("resetUrl", resetUrl);
                    return emailSender.sendMail(
                            email,
                            "Appsmith Password Reset",
                            FORGOT_PASSWORD_EMAIL_TEMPLATE,
                            params
                    );
                })
                .thenReturn(true)
                .onErrorResume(error -> {
                    log.error("Unable to send email because the template replacement failed. Cause: ", error);
                    return Mono.just(true);
                });

        // Connect the components to first find a valid user and then initiate the password reset flow
        return userMono.then(resetFlowMono);
    }

    /**
     * This function verifies if the password reset token and email match each other. Should be initiated after the
     * user has already initiated a password reset request via the 'Forgot Password' link. The tokens are stored in the
     * DB using BCrypt hash.
     *
     * @param email The email of the user whose password is being reset
     * @param token The one-time token provided to the user for resetting the password
     * @return Publishes a boolean indicating whether the given token is valid for the given email address
     */
    @Override
    public Mono<Boolean> verifyPasswordResetToken(String email, String token) {

        return passwordResetTokenRepository
                .findByEmail(email)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "email", email)))
                .flatMap(obj -> {
                    boolean matches = this.passwordEncoder.matches(token, obj.getTokenHash());
                    if (!matches) {
                        return Mono.just(false);
                    }

                    return repository
                            .findByEmail(email)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "user", email)))
                            .map(user -> {
                                user.setPasswordResetInitiated(true);
                                return user;
                            })
                            .flatMap(repository::save)
                            // Everything went fine till now. Cheerio!
                            .thenReturn(true);
                });
    }

    /**
     * This function resets the password using the one-time token & email of the user.
     * This function can only be called via the forgot password route.
     *
     * @param token The one-time token provided to the user for resetting the password
     * @param user  The user object that contains the email & password fields in order to save the new password for the user
     * @return
     */
    @Override
    public Mono<Boolean> resetPasswordAfterForgotPassword(String token, User user) {

        return repository
                .findByEmail(user.getEmail())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "user", user.getEmail())))
                .flatMap(userFromDb -> {
                    if (!userFromDb.getPasswordResetInitiated()) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PASSWORD_RESET));
                    }

                    //User has verified via the forgot password token verfication route. Allow the user to set new password.
                    userFromDb.setPasswordResetInitiated(false);
                    userFromDb.setPassword(passwordEncoder.encode(user.getPassword()));

                    // If the user has been invited but has not signed up yet, and is following the route of reset
                    // password flow to set up their password, enable the user's account as well
                    userFromDb.setIsEnabled(true);

                    return passwordResetTokenRepository
                            .findByEmail(user.getEmail())
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "token", token)))
                            .flatMap(passwordResetTokenRepository::delete)
                            .then(repository.save(userFromDb))
                            .thenReturn(true);
                });
    }

    /**
     * This function invites a new user to the given applicationId. The role for the user is determined
     * by the
     *
     * @param inviteUser
     * @param originHeader
     * @param applicationId
     * @return
     */
    @Override
    public Mono<User> inviteUserToApplication(InviteUser inviteUser, String originHeader, String applicationId) {
        if (originHeader == null || originHeader.isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        // Create an invite token for the user. This token is linked to the email ID and the organization to which the
        // user was invited.
        String token = UUID.randomUUID().toString();

        // Get the application details to which the user is being invited to. The current user must have MANAGE_APPLICATION
        // permission on this app
        Mono<Application> applicationMono = applicationRepository
                .findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));

        // Check if the new user is already a part of the appsmith ecosystem. If yes, then simply
        // add the user with the required permissions to the application
        Mono<User> userByEmail = repository.findByEmail(inviteUser.getEmail())
                .defaultIfEmpty(new User());

        Mono<Application> updatedApplication = Mono.zip(applicationMono, userByEmail)
                .map(tuple -> {
                    Application application = tuple.getT1();
                    User newUser = tuple.getT2();
                    if (newUser.getId() == null) {
                        // The user is not a part of the Appsmith ecosystem. Create an invite token for the user and send an email
                        // TODO: Check if we can still add the user details to the application policies.
                        // TODO : create new user and then add the user to the application
                    }

                    Set<AclPermission> invitePermissions = inviteUser.getRole().getPermissions();
                    // Append the permissions to the application and return
                    Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermission(invitePermissions, inviteUser);
                    return policyUtils.addPoliciesToExistingObject(policyMap, application);

                    // Append the required permissions to all the pages
                    /**
                     * Page : Get child policies from application and update the page policies
                     */

                    // Append the required permissions to all the actions

                    /**
                     * Action : get child policies from page and update the action policies.
                     */
                })
                .flatMap(application -> applicationRepository.save(application));

        Mono<User> userMono = updatedApplication
                .thenReturn(inviteUser);

        return userMono;
    }

    /**
     * This function checks if the inviteToken is valid for the user. If the token is incorrect or it as expired,
     * the client should show the appropriate message to the user
     *
     * @param email
     * @param token
     * @return
     */
    @Override
    public Mono<Boolean> verifyInviteToken(String email, String token) {
        log.debug("Verifying token: {} for email: {}", token, email);
        return repository.findByEmail(email)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "email", email)))
                .flatMap(inviteUser -> passwordEncoder.matches(token, inviteUser.getInviteToken()) ?
                        Mono.just(true) : Mono.just(false));
    }

    /**
     * This function confirms the signup for a new invited user. Primarily it will be used to set the password
     * for the user and set the user to enabled. The user should have been created during the invite flow.
     *
     * @param inviteUser
     * @return
     */
    @Override
    public Mono<Boolean> confirmInviteUser(User inviteUser, String originHeader) {

        if (inviteUser.getEmail() == null || inviteUser.getEmail().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "email"));
        }

        if (inviteUser.getPassword() == null || inviteUser.getPassword().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "password"));
        }

        log.debug("Confirming the signup for the user: {} and token: {}", inviteUser.getEmail(), inviteUser.getInviteToken());

        inviteUser.setPassword(this.passwordEncoder.encode(inviteUser.getPassword()));

        return repository.findByEmail(inviteUser.getEmail())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "email", inviteUser.getEmail())))
                .flatMap(newUser -> {

                    // Activate the user now :
                    newUser.setIsEnabled(true);
                    newUser.setPassword(inviteUser.getPassword());
                    // The user has now been invited and has signed up. Delete the invite token because its no longer required
                    newUser.setInviteToken(null);

                    return repository.save(newUser)
                            .map(savedUser -> sendWelcomeEmail(savedUser, originHeader))
                            .thenReturn(true);
                });
    }

    @Override
    public Mono<User> create(User user) {
        // This is the path that is taken when a new user signs up on its own
        return createUserAndSendEmail(user, null);
    }

    private Set<Policy> crudUserPolicy(User user) {

        Set<AclPermission> aclPermissions = Set.of(MANAGE_USERS, USER_MANAGE_ORGANIZATIONS);

        Map<String, Policy> userPolicies = policyUtils.generatePolicyFromPermission(aclPermissions, user);

        return new HashSet<>(userPolicies.values());
    }

    @Override
    public Mono<User> userCreate(User user) {

        // Only encode the password if it's a form signup. For OAuth signups, we don't need password
        if (user.isEnabled() && LoginSource.FORM.equals(user.getSource())) {
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS));
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        if (!StringUtils.hasText(user.getName())) {
            user.setName(user.getEmail());
        }

        // Set the permissions for the user
        user.getPolicies().addAll(crudUserPolicy(user));

        // Save the new user
        return Mono.just(user)
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .zipWith(configService.getTemplateOrganizationId().defaultIfEmpty(""))
                .flatMap(tuple -> {
                    final String templateOrganizationId = tuple.getT2();

                    if (!StringUtils.hasText(templateOrganizationId)) {
                        // Since template organization is not configured, we create an empty personal organization.
                        final User savedUser = tuple.getT1();
                        log.debug("Creating blank personal organization for user '{}'.", savedUser.getEmail());
                        return organizationService.createPersonal(new Organization(), savedUser);
                    }

                    return Mono.empty();
                })
                .then(repository.findByEmail(user.getUsername()))
                .flatMap(analyticsService::trackNewUser);
    }

    /**
     * This function creates a new user in the system. Primarily used by new users signing up for the first time on the
     * platform. This flow also ensures that a personal workspace name is created for the user. The new user is then
     * given admin permissions to the personal workspace.
     * <p>
     * For new user invite flow, please {@link UserService#inviteUser(InviteUsersDTO, String)}
     *
     * @param user User object representing the user to be created/enabled.
     * @return Publishes the user object, after having been saved.
     */
    @Override
    public Mono<User> createUserAndSendEmail(User user, String originHeader) {

        if (originHeader == null || originHeader.isBlank()) {
            // Default to the production link
            originHeader = DEFAULT_ORIGIN_HEADER;
        }

        final String finalOriginHeader = originHeader;

        // If the user doesn't exist, create the user. If the user exists, return a duplicate key exception
        return repository.findByEmail(user.getUsername())
                .flatMap(savedUser -> {
                    if (!savedUser.isEnabled()) {
                        // First enable the user
                        savedUser.setIsEnabled(true);

                        // In case of form login, store the password
                        if (LoginSource.FORM.equals(user.getSource())) {
                            if (user.getPassword() == null || user.getPassword().isBlank()) {
                                return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS));
                            }

                            /**
                             * At this point, the user's password is encoded (not sure why). So no need to
                             * double encode the password while setting it. Set it directly.
                             * TODO : Figure out why after entering this flatMap that the password stored in the
                             * user changes from simple string to encoded string.
                             */
                            savedUser.setPassword(user.getPassword());
                        }
                        return repository.save(savedUser);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_SIGNUP, user.getUsername()));
                })
                .switchIfEmpty(userCreate(user))
                .flatMap(savedUser -> sendWelcomeEmail(savedUser, finalOriginHeader));

    }

    public Mono<User> sendWelcomeEmail(User user, String originHeader) {
        Map<String, String> params = new HashMap<>();
        params.put("firstName", user.getName());
        params.put("appsmithLink", originHeader);
        return emailSender
                .sendMail(user.getEmail(), "Welcome to Appsmith", WELCOME_USER_EMAIL_TEMPLATE, params)
                .thenReturn(user)
                .onErrorResume(error -> {
                    // Swallowing this exception because we don't want this to affect the rest of the flow.
                    log.error(
                            "Ignoring error: Unable to send welcome email to the user {}. Cause: ",
                            user.getEmail(),
                            Exceptions.unwrap(error)
                    );
                    return Mono.just(user);
                });
    }

    @Override
    public Mono<User> update(String id, User userUpdate) {
        Mono<User> userFromRepository = repository.findById(id, MANAGE_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, id)));

        if (userUpdate.getPassword() != null) {
            // The password is being updated. Hash it first and then store it
            userUpdate.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }

        return userFromRepository
                .map(existingUser -> {
                    BeanCopyUtils.copyNewFieldValuesIntoOldObject(userUpdate, existingUser);
                    return existingUser;
                })
                .flatMap(repository::save);
    }

    /**
     * 1. User doesn't exist :
     * a. Create a new user.
     * b. Set isEnabled to false
     * c. Generate a token. Send out an email informing the user to sign up with token.
     * d. Follow the steps for User which already exists
     * 2. User exists :
     * a. Add user to the organization
     * b. Add organization to the user
     * @return Publishes the invited users, after being saved with the new organization ID.
     */
    @Override
    public Flux<User> inviteUser(InviteUsersDTO inviteUsersDTO, String originHeader) {

        if (originHeader == null || originHeader.isBlank()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        List<String> usernames = inviteUsersDTO.getUsernames();

        if (usernames == null || usernames.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAMES));
        }

        if (inviteUsersDTO.getRoleName() == null || inviteUsersDTO.getRoleName().isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ROLE));
        }

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        // Check if the current user has invite permissions
        Mono<Organization> organizationMono = organizationRepository.findById(inviteUsersDTO.getOrgId(), ORGANIZATION_INVITE_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, inviteUsersDTO.getOrgId())))
                .zipWith(currentUserMono)
                .flatMap(tuple -> {
                    Organization organization = tuple.getT1();
                    User currentUser = tuple.getT2();

                    // This code segment checks if the current user can invite for the invited role.

                    return isUserPermittedToInviteForGivenRole(organization, currentUser.getUsername(), inviteUsersDTO.getRoleName())
                            .thenReturn(organization);
                })
                .cache();


        // Check if the invited user exists. If yes, return the user, else create a new user by triggering
        // createNewUserAndSendInviteEmail. In both the cases, send the appropriate emails

        Flux<User> inviteUsersFlux = Flux.fromIterable(usernames)
                .flatMap(username -> Mono.zip(Mono.just(username), organizationMono, currentUserMono))
                .flatMap(tuple -> {
                    String username = tuple.getT1();
                    Organization organization = tuple.getT2();
                    User currentUser = tuple.getT3();

                    // Email template parameters initialization below.
                    Map<String, String> params = new HashMap<>();
                    if (!StringUtils.isEmpty(currentUser.getName())) {
                        params.put("Inviter_First_Name", currentUser.getName());
                    } else {
                        params.put("Inviter_First_Name", currentUser.getEmail());
                    }
                    params.put("inviter_org_name", organization.getName());

                    return repository.findByEmail(username)
                            .flatMap(existingUser -> {
                                // The user already existed, just send an email informing that the user has been added
                                // to a new organization
                                log.debug("Going to send email to user {} informing that the user has been added to new organization {}",
                                        existingUser.getEmail(), organization.getName());
                                params.put("inviteUrl", originHeader);
                                Mono<String> emailMono = emailSender.sendMail(existingUser.getEmail(),
                                        "Appsmith: You have been added to a new organization",
                                        USER_ADDED_TO_ORGANIZATION_EMAIL_TEMPLATE, params);

                                return emailMono
                                        .thenReturn(existingUser)
                                        .onErrorResume(error -> {
                                            log.error("Unable to send invite user email to {}. Cause: ", existingUser.getEmail(), error);
                                            return Mono.just(existingUser);
                                        });
                            })
                            .switchIfEmpty(createNewUserAndSendInviteEmail(username, originHeader, params));
                })
                .cache();

        // Add User to the invited Organization
        Mono<Organization> organizationWithUsersAddedMono = Mono.zip(inviteUsersFlux.collectList(), organizationMono)
                .flatMap(tuple -> {
                    List<User> invitedUsers = tuple.getT1();
                    Organization organization = tuple.getT2();

                    return userOrganizationService.bulkAddUsersToOrganization(organization, invitedUsers, inviteUsersDTO.getRoleName());
                });

        // Add organization id to each invited user
        Flux<User> usersUpdatedWithOrgMono = inviteUsersFlux
                .flatMap(user -> Mono.zip(Mono.just(user), organizationMono))
                // zipping with organizationMono to ensure that the orgId is checked before updating the user object.
                .flatMap(tuple -> {
                    User invitedUser = tuple.getT1();
                    Organization organization = tuple.getT2();

                    Set<String> organizationIds = invitedUser.getOrganizationIds();
                    if (organizationIds == null) {
                        organizationIds = new HashSet<>();
                    }

                    organizationIds.add(organization.getId());
                    invitedUser.setOrganizationIds(organizationIds);

                    //Lets save the updated user object
                    return repository.save(invitedUser);
                });

        // Trigger the flow to first add the users to the organization and then update each user with the organizationId
        // added to the user's list of organizations.
        return organizationWithUsersAddedMono
                .thenMany(usersUpdatedWithOrgMono);
    }

    private Mono<User> createNewUserAndSendInviteEmail(String email, String originHeader, Map<String, String> params) {
        User newUser = new User();
        newUser.setEmail(email);
        // This is a new user. Till the user signs up, this user would be disabled.
        newUser.setIsEnabled(false);

        // Create an invite token for the user. This token is linked to the email ID and the organization to which the
        // user was invited.
        newUser.setInviteToken(UUID.randomUUID().toString());

        // Call user service's userCreate function so that the personal organization, etc are also created along with assigning basic permissions.
        return userCreate(newUser)
                .flatMap(createdUser -> {
                    log.debug("Going to send email for invite user to {} with token {}", createdUser.getEmail(), createdUser.getInviteToken());
                    String inviteUrl = String.format(
                            INVITE_USER_CLIENT_URL_FORMAT,
                            originHeader,
                            URLEncoder.encode(createdUser.getInviteToken(), StandardCharsets.UTF_8),
                            URLEncoder.encode(createdUser.getEmail(), StandardCharsets.UTF_8)
                    );

                    params.put("token", createdUser.getInviteToken());
                    params.put("inviteUrl", inviteUrl);
                    Mono<String> emailMono = emailSender.sendMail(createdUser.getEmail(), "Invite for Appsmith", INVITE_USER_EMAIL_TEMPLATE, params);

                    // We have sent out the emails. Just send back the saved user.
                    return emailMono
                            .thenReturn(createdUser)
                            .onErrorResume(error -> {
                                log.error("Unable to send invite user email to {}. Cause: ", createdUser.getEmail(), error);
                                return Mono.just(createdUser);
                            });
                });
    }

    private Mono<Boolean> isUserPermittedToInviteForGivenRole(Organization organization, String username, String invitedRoleName) {
        List<UserRole> userRoles = organization.getUserRoles();

        // The current organization has no members. Clearly the current user is also not present
        if (userRoles == null || userRoles.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED));
        }

        Optional<UserRole> optionalUserRole = userRoles.stream().filter(role -> role.getUsername().equals(username)).findFirst();
        // If the current user is not present in the organization, the user would also not be permitted to invite
        if (!optionalUserRole.isPresent()) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED));
        }

        UserRole currentUserRole = optionalUserRole.get();
        String currentUserRoleName = currentUserRole.getRoleName();

        AppsmithRole invitedRole = AppsmithRole.generateAppsmithRoleFromName(invitedRoleName);

        // Generate all the roles for which the current user can invite other users
        Set<AppsmithRole> appsmithRoles = roleGraph.generateHierarchicalRoles(currentUserRoleName);

        // If the role for which users are being invited is not in the list of permissible roles that the
        // current user can invite for, throw an error
        if (!appsmithRoles.contains(invitedRole)) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED));
        }

        return Mono.just(Boolean.TRUE);
    }

}
