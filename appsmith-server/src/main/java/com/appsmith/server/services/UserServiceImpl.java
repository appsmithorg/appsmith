package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.InviteUserDTO;
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
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;

@Slf4j
@Service
public class UserServiceImpl extends BaseService<UserRepository, User, String> implements UserService, ReactiveUserDetailsService {

    private UserRepository repository;
    private final OrganizationService organizationService;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final ApplicationRepository applicationRepository;
    private final PolicyGenerator policyGenerator;
    private final PolicyUtils policyUtils;
    private final OrganizationRepository organizationRepository;
    private final UserOrganizationService userOrganizationService;

    private static final String WELCOME_USER_EMAIL_TEMPLATE = "email/welcomeUserTemplate.html";
    private static final String FORGOT_PASSWORD_EMAIL_TEMPLATE = "email/forgotPasswordTemplate.html";
    private static final String FORGOT_PASSWORD_CLIENT_URL_FORMAT = "%s/user/resetPassword?token=%s&email=%s";
    private static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/createPassword?token=%s&email=%s";
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
                           PolicyGenerator policyGenerator, PolicyUtils policyUtils, OrganizationRepository organizationRepository, UserOrganizationService userOrganizationService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.organizationService = organizationService;
        this.analyticsService = analyticsService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.applicationRepository = applicationRepository;
        this.policyGenerator = policyGenerator;
        this.policyUtils = policyUtils;
        this.organizationRepository = organizationRepository;
        this.userOrganizationService = userOrganizationService;
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
        Mono<User> userMono = repository.findByEmail(email, RESET_PASSWORD_USERS)
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
                .flatMap(resetToken -> passwordResetTokenRepository.save(resetToken))
                .map(obj -> {
                    String resetUrl = String.format(FORGOT_PASSWORD_CLIENT_URL_FORMAT,
                            resetUserPasswordDTO.getBaseUrl(),
                            URLEncoder.encode(token, StandardCharsets.UTF_8),
                            URLEncoder.encode(email, StandardCharsets.UTF_8));
                    Map<String, String> params = Map.of("resetUrl", resetUrl);
                    try {
                        String emailTemplate = emailSender.replaceEmailTemplate(FORGOT_PASSWORD_EMAIL_TEMPLATE, params);
                        emailSender.sendMail(email, "Appsmith Password Reset", emailTemplate);
                    } catch (IOException e) {
                        log.error("Unable to send email because the template replacement failed. Cause: ", e);
                    }
                    return Mono.empty();
                })
                .thenReturn(true);

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
     * @return
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
                            .findByEmail(email, RESET_PASSWORD_USERS)
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
                .findByEmail(user.getEmail(), RESET_PASSWORD_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "user", user.getEmail())))
                .flatMap(userFromDb -> {
                    if (!userFromDb.getPasswordResetInitiated()) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PASSWORD_RESET));
                    }

                    //User has verified via the forgot password token verfication route. Allow the user to set new password.
                    userFromDb.setPasswordResetInitiated(false);
                    userFromDb.setPassword(passwordEncoder.encode(user.getPassword()));
                    return passwordResetTokenRepository
                            .findByEmail(user.getEmail())
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "token", token)))
                            .flatMap(passwordResetTokenRepository::delete)
                            .thenReturn(userFromDb)
                            .flatMap(repository::save)
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
                    return (Application) policyUtils.addPoliciesToExistingObject(policyMap, application);

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
        if (user.getIsEnabled() && LoginSource.FORM.equals(user.getSource())) {
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS));
            }
            user.setPassword(this.passwordEncoder.encode(user.getPassword()));
        }

        Organization personalOrg = new Organization();
        String firstName;
        if (user.getName() != null) {
            // Get the first word from the full name and assume that that's the user's first name
            firstName = user.getName().split(" ")[0];
        } else {
            user.setName(user.getEmail());
            firstName = user.getEmail().split("@")[0];
        }

        String personalOrganizationName = firstName + "'s Personal Organization";
        personalOrg.setName(personalOrganizationName);

        // Set the permissions for the user
        user.getPolicies().addAll(crudUserPolicy(user));

        // Save the new user
        Mono<User> savedUserMono = super.create(user);

        return savedUserMono
                .flatMap(savedUser -> {
                    // Creating the personal workspace and assigning the default groups to the new user
                    log.debug("Going to create organization: {} for user: {}", personalOrg, savedUser.getEmail());
                    return organizationService.create(personalOrg, savedUser)
                            .thenReturn(savedUser);
                })
                .flatMap(analyticsService::trackNewUser);
    }

    /**
     * This function creates a new user in the system. Primarily used by new users signing up for the first time on the
     * platform. This flow also ensures that a personal workspace name is created for the user. The new user is then
     * given admin permissions to the personal workspace.
     * <p>
     * For new user invite flow, please {@link UserService#inviteUser(InviteUserDTO, String)}
     *
     * @param user
     * @return
     */
    @Override
    public Mono<User> createUserAndSendEmail(User user, String originHeader) {
        if (originHeader == null || originHeader.isBlank()) {
            // Default to the production link
            originHeader = DEFAULT_ORIGIN_HEADER;
        }
        final String finalOriginHeader = originHeader;

        return userCreate(user)
                .map(savedUser -> sendWelcomeEmail(savedUser, finalOriginHeader));
    }

    public User sendWelcomeEmail(User user, String originHeader) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("firstName", user.getName());
            params.put("appsmithLink", originHeader);
            String emailBody = emailSender.replaceEmailTemplate(WELCOME_USER_EMAIL_TEMPLATE, params);
            emailSender.sendMail(user.getEmail(), "Welcome to Appsmith", emailBody);
        } catch (IOException e) {
            // Catching and swallowing this exception because we don't want this to affect the rest of the flow
            log.error("Unable to send welcome email to the user {}. Cause: ", user.getEmail(), e);
        }
        return user;
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
     * This function is used by {@link ReactiveUserDetailsService} in order to load the user from the DB. Will be used
     * in cases of username, password logins only. By default, the email ID is the username for the user.
     *
     * @param username
     * @return
     */
    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return repository.findByEmail(username)
                .switchIfEmpty(Mono.error(new UsernameNotFoundException("Unable to find username: " + username)))
                // This object cast is required to ensure that we send the right object type back to Spring framework.
                // Doesn't work without this.
                .map(user -> (UserDetails) user);
    }

    /**
     * 1. User doesn't exist :
     *      a. Create a new user.
     *      b. Set isEnabled to false
     *      c. Generate a token. Send out an email informing the user to sign up with token.
     *      d. Follow the steps for User which already exists
     * 2. User exists :
     *      a. Add user to the organization
     *      b. Add organization to the user
     *
     */
    @Override
    public Mono<User> inviteUser(InviteUserDTO inviteUserDTO, String originHeader) {

        if (originHeader == null || originHeader.isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        if (inviteUserDTO.getRoleName() == null || inviteUserDTO.getRoleName().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ROLE));
        }

        // This variable will be used to decide if an email should be sent to get a user to sign up for appsmith or the
        // email would inform the user that the user has been invited to a new organization
        AtomicBoolean userExisted = new AtomicBoolean(true);

        // If the invited user doesn't exist, create a new user.
        Mono<User> createNewUserMono = Mono.just(inviteUserDTO)
                .flatMap(dto -> {
                    User newUser = new User();
                    newUser.setEmail(dto.getEmail());
                    // This is a new user. Till the user signs up, this user would be disabled.
                    newUser.setIsEnabled(false);
                    userExisted.set(false);
                    // Create an invite token for the user. This token is linked to the email ID and the organization to which the
                    // user was invited.
                    newUser.setInviteToken(UUID.randomUUID().toString());
                    // Call user service's userCreate function so that the personal organization, etc are also created along with assigning basic permissions.
                    return userCreate(newUser);
                });

        // Check if the invited user exists. If yes, return the user, else create a new user by triggering the create
        // new user Mono.
        Mono<User> inviteUserMono = repository.findByEmail(inviteUserDTO.getEmail())
                .switchIfEmpty(createNewUserMono)
                .cache();

        Mono<Organization> organizationMono = organizationRepository.findById(inviteUserDTO.getOrgId(), MANAGE_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, inviteUserDTO.getOrgId())))
                .cache();

        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        // Add User to the invited Organization
        Mono<Organization> organizationWithUserAddedMono = Mono.zip(inviteUserMono, organizationMono)
                .flatMap(tuple -> {
                    User invitedUser = tuple.getT1();
                    Organization organization = tuple.getT2();

                    UserRole userRole = new UserRole();
                    userRole.setUsername(invitedUser.getUsername());
                    userRole.setRoleName(inviteUserDTO.getRoleName());

                    return userOrganizationService.addUserToOrganizationGivenUserObject(organization, invitedUser, userRole);
                });

        // Add invited  Organization to the User
        Mono<User> userUpdatedWithOrgMono = Mono.zip(inviteUserMono, organizationMono)
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


        return Mono.zip(organizationWithUserAddedMono, userUpdatedWithOrgMono, currentUserMono)
                .map(tuple -> {
                    // We reached here. This implies that both user and org got updated without any errors. Proceed forward
                    // with communication (email) here.
                    Organization updatedOrg = tuple.getT1();
                    User updatedUser = tuple.getT2();
                    User currentUser = tuple.getT3();

                    // Email template parameters initialization below.
                    Map<String, String> params = new HashMap<>();
                    if (!StringUtils.isEmpty(currentUser.getName())) {
                        params.put("Inviter_First_Name", currentUser.getName());
                    } else {
                        params.put("Inviter_First_Name", currentUser.getEmail());
                    }
                    params.put("inviter_org_name", updatedOrg.getName());

                    if (userExisted.get()) {

                        // If the user already existed, just send an email informing that the user has been added
                        // to a new organization
                        log.debug("Going to send email to user {} informing that the user has been added to new organization {}",
                                updatedUser.getEmail(), updatedOrg.getName());
                        try {
                            String inviteUrl = originHeader;
                            params.put("inviteUrl", inviteUrl);
                            String emailBody = emailSender.replaceEmailTemplate(USER_ADDED_TO_ORGANIZATION_EMAIL_TEMPLATE, params);
                            emailSender.sendMail(updatedUser.getEmail(), "Appsmith: You have been added to a new organization", emailBody);
                        } catch (IOException e) {
                            log.error("Unable to send invite user email to {}. Cause: ", updatedUser.getEmail(), e);
                        }

                    } else {
                        // The user was created and then added to the organization. Send an email to the user to sign
                        // up on Appsmith platform with the token generated during create user.
                        log.debug("Going to send email for invite user to {} with token {}", updatedUser.getEmail(), updatedUser.getInviteToken());
                        try {
                            String inviteUrl = String.format(INVITE_USER_CLIENT_URL_FORMAT, originHeader,
                                    URLEncoder.encode(updatedUser.getInviteToken(), StandardCharsets.UTF_8),
                                    URLEncoder.encode(updatedUser.getEmail(), StandardCharsets.UTF_8));
                            params.put("token", updatedUser.getInviteToken());
                            params.put("inviteUrl", inviteUrl);
                            String emailBody = emailSender.replaceEmailTemplate(INVITE_USER_EMAIL_TEMPLATE, params);
                            emailSender.sendMail(updatedUser.getEmail(), "Invite for Appsmith", emailBody);
                        } catch (IOException e) {
                            log.error("Unable to send invite user email to {}. Cause: ", updatedUser.getEmail(), e);
                        }
                    }
                    // We have sent out the emails. Just send back the saved user.
                    return updatedUser;
                });
    }

}
