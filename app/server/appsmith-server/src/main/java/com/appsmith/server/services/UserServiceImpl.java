package com.appsmith.server.services;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.EmailTokenDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.UserChangedHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.message.BasicNameValuePair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
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
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

@Slf4j
@Service
public class UserServiceImpl extends BaseService<UserRepository, User, String> implements UserService {

    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final ApplicationRepository applicationRepository;
    private final PolicyUtils policyUtils;
    private final OrganizationRepository organizationRepository;
    private final UserOrganizationService userOrganizationService;
    private final RoleGraph roleGraph;
    private final CommonConfig commonConfig;
    private final EmailConfig emailConfig;
    private final UserChangedHandler userChangedHandler;
    private final EncryptionService encryptionService;
    private final UserDataService userDataService;

    private static final String WELCOME_USER_EMAIL_TEMPLATE = "email/welcomeUserTemplate.html";
    private static final String FORGOT_PASSWORD_EMAIL_TEMPLATE = "email/forgotPasswordTemplate.html";
    private static final String FORGOT_PASSWORD_CLIENT_URL_FORMAT = "%s/user/resetPassword?token=%s";
    private static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?email=%s";
    private static final String INVITE_USER_EMAIL_TEMPLATE = "email/inviteUserCreatorTemplate.html";
    private static final String USER_ADDED_TO_ORGANIZATION_EMAIL_TEMPLATE = "email/inviteExistingUserToOrganizationTemplate.html";

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
                           ConfigService configService,
                           CommonConfig commonConfig,
                           EmailConfig emailConfig,
                           UserChangedHandler userChangedHandler,
                           EncryptionService encryptionService,
                           ApplicationPageService applicationPageService,
                           UserDataService userDataService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.organizationService = organizationService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.applicationRepository = applicationRepository;
        this.policyUtils = policyUtils;
        this.organizationRepository = organizationRepository;
        this.userOrganizationService = userOrganizationService;
        this.roleGraph = roleGraph;
        this.commonConfig = commonConfig;
        this.emailConfig = emailConfig;
        this.userChangedHandler = userChangedHandler;
        this.encryptionService = encryptionService;
        this.userDataService = userDataService;
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
     * collection with an expiry time of 48 hours. The user must provide this one-time token when updating with the new password.
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
        final String token = UUID.randomUUID().toString();
        log.debug("Password reset Token: {} for email: {}", token, email);

        // Check if the user exists in our DB. If not, we will not send a password reset link to the user
        Mono<User> userMono = repository.findByEmail(email)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)));

        // Generate the password reset link for the user
        Mono<PasswordResetToken> passwordResetTokenMono = passwordResetTokenRepository.findByEmail(email)
                .switchIfEmpty(Mono.defer(() -> {
                    PasswordResetToken passwordResetToken = new PasswordResetToken();
                    passwordResetToken.setEmail(email);
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

        // Save the password reset link and send email to the user
        Mono<Boolean> resetFlowMono = passwordResetTokenMono
                .flatMap(passwordResetTokenRepository::save)
                .flatMap(obj -> {
                    List<NameValuePair> nameValuePairs = new ArrayList<>(2);
                    nameValuePairs.add(new BasicNameValuePair("email", email));
                    nameValuePairs.add(new BasicNameValuePair("token", token));
                    String urlParams = URLEncodedUtils.format(nameValuePairs, StandardCharsets.UTF_8);
                    String resetUrl = String.format(
                            FORGOT_PASSWORD_CLIENT_URL_FORMAT,
                            resetUserPasswordDTO.getBaseUrl(),
                            encryptionService.encryptString(urlParams)
                    );

                    Map<String, String> params = Map.of("resetUrl", resetUrl);
                    return emailSender.sendMail(
                            email,
                            "Appsmith Password Reset",
                            FORGOT_PASSWORD_EMAIL_TEMPLATE,
                            params
                    );
                })
                .thenReturn(true);

        // Connect the components to first find a valid user and then initiate the password reset flow
        return userMono.then(resetFlowMono);
    }

    /**
     * This method checks whether the reset request limit has been exceeded.
     * If the limit has been exceeded, it raises an Exception.
     * Otherwise, it'll update the counter and date in the resetToken object
     * @param resetToken {@link PasswordResetToken}
     */
    private void validateResetLimit(PasswordResetToken resetToken) {
        if(resetToken.getRequestCount() >= 3) {
            Duration duration = Duration.between(resetToken.getFirstRequestTime(), Instant.now());
            long l = duration.toHours();
            if(l >= 24) { // ok, reset the counter
                resetToken.setRequestCount(1);
                resetToken.setFirstRequestTime(Instant.now());
            } else { // too many requests, raise an exception
                throw new AppsmithException(AppsmithError.TOO_MANY_REQUESTS);
            }
        } else {
            resetToken.setRequestCount(resetToken.getRequestCount() + 1);
            if(resetToken.getFirstRequestTime() == null) {
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
        } catch (IllegalStateException e) {
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
     * @param user  The user object that contains the email & password fields in order to save the new password for the user
     * @return
     */
    @Override
    public Mono<Boolean> resetPasswordAfterForgotPassword(String encryptedToken, User user) {
        EmailTokenDTO emailTokenDTO;
        try {
            emailTokenDTO = parseValueFromEncryptedToken(encryptedToken);
        } catch (IllegalStateException e) {
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
                            if(!ValidationUtils.validateLoginPassword(user.getPassword())){
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
                                    .thenReturn(true);
                        }));
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED,
                        "Invite users to this application")));

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

    @Override
    public Mono<User> create(User user) {
        // This is the path that is taken when a new user signs up on its own
        return createUserAndSendEmail(user, null).map(UserSignupDTO::getUser);
    }

    private Set<Policy> crudUserPolicy(User user) {

        Set<AclPermission> aclPermissions = Set.of(MANAGE_USERS, USER_MANAGE_ORGANIZATIONS);

        Map<String, Policy> userPolicies = policyUtils.generatePolicyFromPermission(aclPermissions, user);

        return new HashSet<>(userPolicies.values());
    }

    @Override
    public Mono<User> userCreate(User user) {
        // It is assumed here that the user's password has already been encoded.

        // Set the permissions for the user
        user.getPolicies().addAll(crudUserPolicy(user));

        // Save the new user
        return Mono.just(user)
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .then(Mono.zip(
                        repository.findByEmail(user.getUsername()),
                        userDataService.getForUserEmail(user.getUsername())
                ))
                .flatMap(tuple -> analyticsService.identifyUser(tuple.getT1(), tuple.getT2()));
    }

    /**
     * This function creates a new user in the system. Primarily used by new users signing up for the first time on the
     * platform. This flow also ensures that a default organization name is created for the user. The new user is then
     * given admin permissions to the default organization.
     * <p>
     * For new user invite flow, please {@link UserService#inviteUsers(InviteUsersDTO, String)}
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

                                log.debug("Creating blank default organization for user '{}'.", savedUser.getEmail());
                                return organizationService.createDefault(new Organization(), savedUser)
                                        .map(org -> {
                                            userSignupDTO.setDefaultOrganizationId(org.getId());
                                            return userSignupDTO;
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
        if (!commonConfig.getAdminEmails().contains(user.getEmail())) {
            // If this is not an admin email address, only then do we check if signup should be allowed or not. Being an
            // explicitly set admin email address trumps all everything and signup for this email can never be disabled.

            if (commonConfig.isSignupDisabled()) {
                // Signing up has been globally disabled. Reject.
                return Mono.error(new AppsmithException(AppsmithError.SIGNUP_DISABLED));
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
                return Mono.error(new AppsmithException(AppsmithError.SIGNUP_DISABLED));
            }
        }

        // No special configurations found, allow signup for the new user.
        return userCreate(user);
    }

    public Mono<User> sendWelcomeEmail(User user, String originHeader) {
        Map<String, String> params = new HashMap<>();
        params.put("firstName", user.getName());
        params.put("inviteUrl", originHeader);
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
                .flatMap(repository::save)
                .map(userChangedHandler::publish);
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
     *
     * @return Publishes the invited users, after being saved with the new organization ID.
     */
    @Override
    public Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader) {

        if (originHeader == null || originHeader.isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        List<String> originalUsernames = inviteUsersDTO.getUsernames();

        if (originalUsernames == null || originalUsernames.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAMES));
        }

        if (inviteUsersDTO.getRoleName() == null || inviteUsersDTO.getRoleName().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ROLE));
        }

        List<String> usernames = new ArrayList<>();
        for (String username : originalUsernames) {
            usernames.add(username.toLowerCase());
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

                    return repository.findByEmail(username)
                            .flatMap(existingUser -> {
                                // The user already existed, just send an email informing that the user has been added
                                // to a new organization
                                log.debug("Going to send email to user {} informing that the user has been added to new organization {}",
                                        existingUser.getEmail(), organization.getName());

                                // Email template parameters initialization below.
                                Map<String, String> params = getEmailParams(organization, currentUser, originHeader, false);

                                Mono<Boolean> emailMono = emailSender.sendMail(existingUser.getEmail(),
                                        "Appsmith: You have been added to a new organization",
                                        USER_ADDED_TO_ORGANIZATION_EMAIL_TEMPLATE, params);

                                return emailMono
                                        .thenReturn(existingUser);
                            })
                            .switchIfEmpty(createNewUserAndSendInviteEmail(username, originHeader, organization, currentUser, inviteUsersDTO.getRoleName()));
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
        Mono<List<User>> usersUpdatedWithOrgMono = inviteUsersFlux
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
                })
                .collectList()
                .flatMap(users -> Mono.zip(Mono.just(users), currentUserMono))
                .flatMap(tuple -> {
                    List<User> users = tuple.getT1();
                    User currentUser = tuple.getT2();

                    HashMap<String, Object> analyticsProperties = new HashMap<>();
                    long numberOfUsers = users.size();
                    List<String> invitedUsers = new ArrayList<>();
                    for (User user: users) {
                        invitedUsers.add(user.getEmail());
                    }
                    analyticsProperties.put("numberOfUsersInvited", numberOfUsers);
                    analyticsProperties.put("userEmails", invitedUsers);
                    analyticsService.sendEvent("execute_INVITE_USERS", currentUser.getEmail(), analyticsProperties);
                    return Mono.just(users);
                });

        // Trigger the flow to first add the users to the organization and then update each user with the organizationId
        // added to the user's list of organizations.
        Mono<List<User>> triggerAddUserOrganizationFinalFlowMono = organizationWithUsersAddedMono
                .then(usersUpdatedWithOrgMono);

        //  Use a synchronous sink which does not take subscription cancellations into account. This that even if the
        //  subscriber has cancelled its subscription, the create method will still generates its event.
        return Mono.create(sink -> triggerAddUserOrganizationFinalFlowMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    private Mono<User> createNewUserAndSendInviteEmail(String email, String originHeader, Organization organization, User inviter, String role) {
        User newUser = new User();
        newUser.setEmail(email.toLowerCase());

        // This is a new user. Till the user signs up, this user would be disabled.
        newUser.setIsEnabled(false);

        // The invite token is not used today and doesn't need to be verified. We still save the invite token with the
        // role information to classify the user persona.
        newUser.setInviteToken(role + ":" + UUID.randomUUID());

        // Call user service's userCreate function so that the default organization, etc are also created along with assigning basic permissions.
        return userCreate(newUser)
                .flatMap(createdUser -> {
                    log.debug("Going to send email for invite user to {}", createdUser.getEmail());
                    String inviteUrl = String.format(
                            INVITE_USER_CLIENT_URL_FORMAT,
                            originHeader,
                            URLEncoder.encode(createdUser.getEmail(), StandardCharsets.UTF_8)
                    );

                    // Email template parameters initialization below.
                    Map<String, String> params = getEmailParams(organization, inviter, inviteUrl, true);

                    Mono<Boolean> emailMono = emailSender.sendMail(createdUser.getEmail(), "Invite for Appsmith", INVITE_USER_EMAIL_TEMPLATE, params);

                    // We have sent out the emails. Just send back the saved user.
                    return emailMono
                            .thenReturn(createdUser);
                });
    }

    private Mono<Boolean> isUserPermittedToInviteForGivenRole(Organization organization, String username, String invitedRoleName) {
        List<UserRole> userRoles = organization.getUserRoles();

        // The current organization has no members. Clearly the current user is also not present
        if (userRoles == null || userRoles.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED,
                    "Invite a user for the role " + invitedRoleName));
        }

        Optional<UserRole> optionalUserRole = userRoles.stream().filter(role -> role.getUsername().equals(username)).findFirst();
        // If the current user is not present in the organization, the user would also not be permitted to invite
        if (!optionalUserRole.isPresent()) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED,
                    "Invite a user for the role " + invitedRoleName));
        }

        UserRole currentUserRole = optionalUserRole.get();
        String currentUserRoleName = currentUserRole.getRoleName();

        AppsmithRole invitedRole = AppsmithRole.generateAppsmithRoleFromName(invitedRoleName);

        // Generate all the roles for which the current user can invite other users
        Set<AppsmithRole> appsmithRoles = roleGraph.generateHierarchicalRoles(currentUserRoleName);

        // If the role for which users are being invited is not in the list of permissible roles that the
        // current user can invite for, throw an error
        if (!appsmithRoles.contains(invitedRole)) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED,
                    "Invite a user for the role " + invitedRoleName));
        }

        return Mono.just(Boolean.TRUE);
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

    public Map<String, String> getEmailParams(Organization organization, User inviter, String inviteUrl, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();

        if (inviter != null) {
            if (!StringUtils.isEmpty(inviter.getName())) {
                params.put("Inviter_First_Name", inviter.getName());
            } else {
                params.put("Inviter_First_Name", inviter.getEmail());
            }
        }
        if (organization != null) {
            params.put("inviter_org_name", organization.getName());
        }
        if (isNewUser) {
            params.put("inviteUrl", inviteUrl);
        } else {
            params.put("inviteUrl", inviteUrl + "/applications#" + organization.getSlug());
        }
        return params;
    }

    @Override
    public Mono<Boolean> isUsersEmpty() {
        return repository.isUsersEmpty();
    }

    @Override
    public Mono<UserProfileDTO> buildUserProfileDTO(User user) {
        return Mono.zip(
                        isUsersEmpty(),
                        user.isAnonymous() ? Mono.just(user) : findByEmail(user.getEmail()),
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData())
                )
                .map(tuple -> {
                    final boolean isUsersEmpty = Boolean.TRUE.equals(tuple.getT1());
                    final User userFromDb = tuple.getT2();
                    final UserData userData = tuple.getT3();

                    final UserProfileDTO profile = new UserProfileDTO();

                    profile.setEmail(userFromDb.getEmail());
                    profile.setOrganizationIds(userFromDb.getOrganizationIds());
                    profile.setUsername(userFromDb.getUsername());
                    profile.setName(userFromDb.getName());
                    profile.setGender(userFromDb.getGender());
                    profile.setEmptyInstance(isUsersEmpty);
                    profile.setAnonymous(userFromDb.isAnonymous());
                    profile.setEnabled(userFromDb.isEnabled());
                    profile.setCommentOnboardingState(userData.getCommentOnboardingState());
                    profile.setRole(userData.getRole());
                    profile.setUseCase(userData.getUseCase());
                    profile.setPhotoId(userData.getProfilePhotoAssetId());

                    profile.setSuperUser(policyUtils.isPermissionPresentForUser(
                            userFromDb.getPolicies(),
                            AclPermission.MANAGE_INSTANCE_ENV.getValue(),
                            userFromDb.getUsername()
                    ));
                    profile.setConfigurable(!StringUtils.isEmpty(commonConfig.getEnvFilePath()));

                    return profile;
                });
    }

    private EmailTokenDTO parseValueFromEncryptedToken(String encryptedToken) {
        String decryptString = encryptionService.decryptString(encryptedToken);
        List<NameValuePair> nameValuePairs = URLEncodedUtils.parse(decryptString, StandardCharsets.UTF_8);
        Map<String, String> params = new HashMap<>();

        for(NameValuePair nameValuePair : nameValuePairs) {
            params.put(nameValuePair.getName(), nameValuePair.getValue());
        }
        return new EmailTokenDTO(params.get("email"), params.get("token"));
    }
}
