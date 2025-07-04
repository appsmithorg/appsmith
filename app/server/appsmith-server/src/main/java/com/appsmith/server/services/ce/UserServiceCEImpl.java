package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.EmailVerificationToken;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.EmailTokenDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResendEmailVerificationDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserServiceHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.EmailVerificationTokenRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PACConfigurationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.WWWFormCodec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.constants.FieldName.ORGANIZATION;
import static com.appsmith.server.constants.ce.FieldNameCE.USER;
import static com.appsmith.server.helpers.RedirectHelper.DEFAULT_REDIRECT_URL;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.validateUserPassword;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class UserServiceCEImpl extends BaseService<UserRepository, User, String> implements UserServiceCE {

    private final WorkspaceService workspaceService;
    private final SessionUserService sessionUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final PasswordEncoder passwordEncoder;

    private final CommonConfig commonConfig;
    private final UserDataService userDataService;
    private final OrganizationService organizationService;
    private final UserUtils userUtils;
    private final EmailService emailService;
    private final RateLimitService rateLimitService;
    private final PACConfigurationService pacConfigurationService;

    private final UserServiceHelper userPoliciesComputeHelper;
    private final InstanceVariablesHelper instanceVariablesHelper;

    protected static final WebFilterChain EMPTY_WEB_FILTER_CHAIN = serverWebExchange -> Mono.empty();
    private static final String FORGOT_PASSWORD_CLIENT_URL_FORMAT = "%s/user/resetPassword?token=%s";
    private static final Pattern ALLOWED_ACCENTED_CHARACTERS_PATTERN = Pattern.compile("^[\\p{L} 0-9 .\'\\-]+$");

    private static final String EMAIL_VERIFICATION_CLIENT_URL_FORMAT =
            "%s/user/verify?token=%s&email=%s&organizationId=%s&redirectUrl=%s";

    private static final String EMAIL_VERIFICATION_ERROR_URL_FORMAT = "/user/verify-error?code=%s&message=%s&email=%s";
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    @Autowired
    public UserServiceCEImpl(
            Validator validator,
            UserRepository repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            CommonConfig commonConfig,
            UserDataService userDataService,
            OrganizationService organizationService,
            UserUtils userUtils,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            EmailService emailService,
            RateLimitService rateLimitService,
            PACConfigurationService pacConfigurationService,
            UserServiceHelper userServiceHelper,
            InstanceVariablesHelper instanceVariablesHelper) {

        super(validator, repository, analyticsService);
        this.workspaceService = workspaceService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.commonConfig = commonConfig;
        this.userDataService = userDataService;
        this.organizationService = organizationService;
        this.userUtils = userUtils;
        this.rateLimitService = rateLimitService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.emailService = emailService;
        this.userPoliciesComputeHelper = userServiceHelper;
        this.pacConfigurationService = pacConfigurationService;
        this.instanceVariablesHelper = instanceVariablesHelper;
    }

    @Override
    public Mono<User> findByEmail(String email) {
        return organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> findByEmailAndOrganizationId(email, organizationId));
    }

    @Override
    public Mono<User> findByEmailAndOrganizationId(String email, String organizationId) {
        return repository.findByEmailAndOrganizationId(email, organizationId);
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

        if (resetUserPasswordDTO.getBaseUrl() == null
                || resetUserPasswordDTO.getBaseUrl().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        String email = resetUserPasswordDTO.getEmail();

        // Create a random token to be sent out.
        final String token = UUID.randomUUID().toString();

        // Check if the user exists in our DB. If not, we will not send a password reset link to the user
        return organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> {
                    return repository
                            .findByEmailAndOrganizationId(email, organizationId)
                            .switchIfEmpty(repository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                                    email, organizationId))
                            .switchIfEmpty(Mono.error(
                                    new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)))
                            .flatMap(user -> {
                                // an user found with the provided email address
                                // Generate the password reset link for the user
                                return passwordResetTokenRepository
                                        .findByEmailAndOrganizationId(user.getEmail(), user.getOrganizationId())
                                        .switchIfEmpty(Mono.defer(() -> {
                                            PasswordResetToken passwordResetToken = new PasswordResetToken();
                                            passwordResetToken.setEmail(user.getEmail());
                                            passwordResetToken.setRequestCount(0);
                                            passwordResetToken.setOrganizationId(organizationId);
                                            passwordResetToken.setFirstRequestTime(Instant.now());
                                            return Mono.just(passwordResetToken);
                                        }))
                                        .map(resetToken -> {
                                            // check the validity of the token
                                            validateResetLimit(resetToken);
                                            resetToken.setTokenHash(passwordEncoder.encode(token));
                                            return resetToken;
                                        });
                            });
                })
                .flatMap(passwordResetTokenRepository::save)
                .flatMap(passwordResetToken -> {
                    log.debug("Password reset Token: {} for email: {}", token, passwordResetToken.getEmail());

                    List<NameValuePair> nameValuePairs = new ArrayList<>(2);
                    nameValuePairs.add(new BasicNameValuePair("email", passwordResetToken.getEmail()));
                    nameValuePairs.add(new BasicNameValuePair("token", token));
                    String urlParams = WWWFormCodec.format(nameValuePairs, StandardCharsets.UTF_8);
                    String resetUrl = String.format(
                            FORGOT_PASSWORD_CLIENT_URL_FORMAT,
                            resetUserPasswordDTO.getBaseUrl(),
                            EncryptionHelper.encrypt(urlParams));

                    log.debug("Password reset url for email: {}: {}", passwordResetToken.getEmail(), resetUrl);

                    return emailService.sendForgotPasswordEmail(email, resetUrl, resetUserPasswordDTO.getBaseUrl());
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

    private Boolean isEmailVerificationTokenValid(EmailVerificationToken emailVerificationToken) {
        Duration duration = Duration.between(emailVerificationToken.getTokenGeneratedAt(), Instant.now());
        long l = duration.toHours();
        if (l > 48) { // the token has expired
            return FALSE;
        }
        return TRUE;
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

        return organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> passwordResetTokenRepository.findByEmailAndOrganizationId(
                        emailTokenDTO.getEmail(), organizationId))
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

        Mono<Organization> organizationMono = organizationService
                .getCurrentUserOrganization()
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, USER, ORGANIZATION)))
                .cache();

        Mono<String> orgIdMono = organizationMono.map(Organization::getId);

        return organizationMono
                .flatMap(organization -> passwordResetTokenRepository.findByEmailAndOrganizationId(
                        emailTokenDTO.getEmail(), organization.getId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PASSWORD_RESET)))
                .map(passwordResetToken -> {
                    boolean matches =
                            this.passwordEncoder.matches(emailTokenDTO.getToken(), passwordResetToken.getTokenHash());
                    if (!matches) {
                        throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, FieldName.TOKEN);
                    } else {
                        return emailTokenDTO.getEmail();
                    }
                })
                .zipWith(orgIdMono)
                .flatMap(tuple -> {
                    String emailAddress = tuple.getT1();
                    String orgId = tuple.getT2();
                    return repository
                            .findByEmailAndOrganizationId(emailAddress, orgId)
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, emailAddress)));
                })
                .zipWith(organizationMono)
                .flatMap(tuple -> {
                    User userFromDb = tuple.getT1();
                    OrganizationConfiguration organizationConfiguration =
                            tuple.getT2().getOrganizationConfiguration();
                    boolean isStrongPasswordPolicyEnabled = organizationConfiguration != null
                            && Boolean.TRUE.equals(organizationConfiguration.getIsStrongPasswordPolicyEnabled());

                    if (!validateUserPassword(user.getPassword(), isStrongPasswordPolicyEnabled)) {
                        return isStrongPasswordPolicyEnabled
                                ? Mono.error(new AppsmithException(
                                        AppsmithError.INSUFFICIENT_PASSWORD_STRENGTH,
                                        LOGIN_PASSWORD_MIN_LENGTH,
                                        LOGIN_PASSWORD_MAX_LENGTH))
                                : Mono.error(new AppsmithException(
                                        AppsmithError.INVALID_PASSWORD_LENGTH,
                                        LOGIN_PASSWORD_MIN_LENGTH,
                                        LOGIN_PASSWORD_MAX_LENGTH));
                    }

                    // User has verified via the forgot password token verfication route. Allow the user to set
                    // new password.
                    userFromDb.setPasswordResetInitiated(false);
                    userFromDb.setPassword(passwordEncoder.encode(user.getPassword()));

                    // If the user has been invited but has not signed up yet, and is following the route of
                    // reset
                    // password flow to set up their password, enable the user's account as well
                    userFromDb.setIsEnabled(true);

                    return organizationService
                            .getCurrentUserOrganizationId()
                            .flatMap(organizationId -> passwordResetTokenRepository.findByEmailAndOrganizationId(
                                    userFromDb.getEmail(), organizationId))
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND, FieldName.TOKEN, emailTokenDTO.getToken())))
                            .flatMap(passwordResetTokenRepository::delete)
                            .then(repository.save(userFromDb))
                            .doOnSuccess(result -> {
                                // In a separate thread, we delete all other sessions of this user.
                                sessionUserService
                                        .logoutAllSessions(userFromDb.getEmail())
                                        .subscribeOn(Schedulers.boundedElastic())
                                        .subscribe();

                                // we reset the counter for user's login attempts once password is reset
                                rateLimitService
                                        .resetCounter(
                                                RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API, userFromDb.getEmail())
                                        .subscribeOn(Schedulers.boundedElastic())
                                        .subscribe();
                            })
                            .thenReturn(true);
                });
    }

    @Override
    public Mono<User> create(User user) {
        // This is the path that is taken when a new user signs up on its own
        return createUser(user).map(UserSignupDTO::getUser);
    }

    @Override
    public Mono<User> userCreate(User user, boolean isAdminUser) {
        // It is assumed here that the user's password has already been encoded.

        // convert the user email to lowercase
        user.setEmail(user.getEmail().toLowerCase());

        Mono<User> userWithOrgMono =
                Mono.just(user).flatMap(this::setOrganizationIdForUser).cache();
        // Save the new user
        return userWithOrgMono
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .flatMap(this::addUserPoliciesAndSaveToRepo)
                .flatMap(crudUser -> {
                    if (isAdminUser) {
                        return userUtils
                                .makeInstanceAdministrator(List.of(crudUser))
                                .then(Mono.just(crudUser));
                    }
                    return Mono.just(crudUser);
                })
                .then(Mono.zip(
                        userWithOrgMono.flatMap(userWithOrg -> repository.findByEmailAndOrganizationId(
                                user.getUsername(), userWithOrg.getOrganizationId())),
                        userDataService.getForUserEmail(user.getUsername())))
                .flatMap(tuple -> analyticsService.identifyUser(tuple.getT1(), tuple.getT2()));
    }

    private Mono<User> addUserPoliciesAndSaveToRepo(User user) {
        return userPoliciesComputeHelper.addPoliciesToUser(user).flatMap(repository::save);
    }

    protected Mono<Boolean> isSignupAllowed(User user) {
        return Mono.just(TRUE);
    }

    /**
     * Checks if a workspace should be created for a user during signup.
     * This method can be overridden in EE to add checks for multi-org settings.
     *
     * @param user The user for whom to check workspace creation
     * @return Mono<Boolean> true if workspace should be created, false otherwise
     */
    protected Mono<Boolean> shouldCreateWorkspaceForUser(User user) {
        // In CE, always create workspace
        return Mono.just(TRUE);
    }

    @Override
    public Mono<UserSignupDTO> createUser(User user) {
        // Only encode the password if it's a form signup. For OAuth signups, we don't need password
        if (LoginSource.FORM.equals(user.getSource())) {
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS));
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // If the user doesn't exist, create the user. If the user exists, return a duplicate key exception
        return organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> {
                    return repository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                            user.getUsername(), organizationId);
                })
                .flatMap(savedUser -> {
                    if (!savedUser.isEnabled()) {
                        return isSignupAllowed(user).flatMap(isSignupAllowed -> {
                            if (isSignupAllowed) {
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

                            return Mono.error(new AppsmithException(AppsmithError.SIGNUP_DISABLED, user.getUsername()));
                        });
                    }

                    return Mono.error(
                            new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_SIGNUP, savedUser.getUsername()));
                })
                .switchIfEmpty(Mono.defer(() -> {
                    return signupIfAllowed(user)
                            .flatMap(savedUser -> {
                                final UserSignupDTO userSignupDTO = new UserSignupDTO();
                                userSignupDTO.setUser(savedUser);

                                // Check if we should create a workspace for this user
                                return shouldCreateWorkspaceForUser(savedUser).flatMap(shouldCreateWorkspace -> {
                                    if (Boolean.TRUE.equals(shouldCreateWorkspace)) {
                                        // Create workspace as normal
                                        return workspaceService
                                                .createDefault(new Workspace(), savedUser)
                                                .elapsed()
                                                .map(pair -> {
                                                    log.debug(
                                                            "UserServiceCEImpl::Time taken to create default workspace: {} ms",
                                                            pair.getT1());
                                                    return pair.getT2();
                                                })
                                                .map(workspace -> {
                                                    log.debug(
                                                            "Created blank default workspace for user '{}'.",
                                                            savedUser.getEmail());
                                                    userSignupDTO.setDefaultWorkspaceId(workspace.getId());
                                                    return userSignupDTO;
                                                })
                                                .onErrorResume(e -> {
                                                    log.debug(
                                                            "Error creating default workspace for user '{}'.",
                                                            savedUser.getEmail(),
                                                            e);
                                                    return Mono.just(userSignupDTO);
                                                });
                                    } else {
                                        // Skip workspace creation
                                        log.debug("Skipping workspace creation for user: {}", savedUser.getEmail());
                                        return Mono.just(userSignupDTO);
                                    }
                                });
                            })
                            .flatMap(userSignupDTO -> findByEmail(
                                            userSignupDTO.getUser().getEmail())
                                    .map(user1 -> {
                                        userSignupDTO.setUser(user1);
                                        return userSignupDTO;
                                    }))
                            .elapsed()
                            .map(pair -> {
                                log.debug("UserServiceCEImpl::Time taken to find created user: {} ms", pair.getT1());
                                return pair.getT2();
                            });
                }));
    }

    /**
     * Sets the organization ID for a new user during signup.
     *
     * @param user User object for which to set the organization ID
     * @return Mono<User> with organization ID set
     */
    protected Mono<User> setOrganizationIdForUser(User user) {
        if (user.getOrganizationId() == null) {
            return organizationService.getCurrentUserOrganizationId().map(organizationId -> {
                user.setOrganizationId(organizationId);
                return user;
            });
        }
        return Mono.just(user);
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
    public Mono<User> signupIfAllowed(User user) {
        Mono<Boolean> isAdminUserMono;

        if (!commonConfig.getAdminEmails().contains(user.getEmail())) {
            // If this is not an admin email address, only then do we check if signup should be allowed or not. Being an
            // explicitly set admin email address trumps all everything and signup for this email can never be disabled.
            isAdminUserMono = organizationService.getCurrentUserOrganization().map(organization -> {
                OrganizationConfiguration organizationConfiguration =
                        organization.getOrganizationConfiguration() == null
                                ? new OrganizationConfiguration()
                                : organization.getOrganizationConfiguration();
                if (TRUE.equals(organizationConfiguration.getIsSignupDisabled())) {
                    // Signing up has been globally disabled. Reject.
                    throw new AppsmithException(AppsmithError.SIGNUP_DISABLED, user.getUsername());
                }
                final List<String> allowedDomains = user.getSource() == LoginSource.FORM
                        ? commonConfig.getAllowedDomains()
                        : commonConfig.getOauthAllowedDomains();
                if (!CollectionUtils.isEmpty(allowedDomains)
                        && StringUtils.hasText(user.getEmail())
                        && user.getEmail().contains("@")
                        && !allowedDomains.contains(user.getEmail().split("@")[1])) {
                    // There is an explicit whitelist of email address domains that should be allowed. If the new email
                    // is
                    // of a different domain, reject.
                    throw new AppsmithException(AppsmithError.SIGNUP_DISABLED, user.getUsername());
                }
                return FALSE;
            });
        } else {
            isAdminUserMono = Mono.just(true);
        }

        // No special configurations found, allow signup for the new user.
        return setOrganizationIdForUser(user)
                .zipWhen(userWithOrgId -> isAdminUserMono)
                .flatMap(tuple2 -> userCreate(tuple2.getT1(), tuple2.getT2()))
                .elapsed()
                .map(pair -> {
                    log.debug("UserServiceCEImpl::Time taken for create user: {} ms", pair.getT1());
                    return pair.getT2();
                });
    }

    @Override
    public Mono<User> update(String id, User userUpdate) {
        Mono<User> userFromRepository = repository
                .findById(id, MANAGE_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, id)));

        return userFromRepository.flatMap(existingUser -> this.update(existingUser, userUpdate));
    }

    /**
     * Method to update user without ACL permission. This will be used internally to update the user
     *
     * @param id     UserId which needs to be updated
     * @param update User object
     * @return Updated user
     */
    @Override
    public Mono<User> updateWithoutPermission(String id, User update) {
        Mono<User> userFromRepository = repository
                .findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, id)));

        return userFromRepository.flatMap(existingUser -> this.update(existingUser, update));
    }

    @Override
    public Mono<Integer> updateWithoutPermission(String id, UpdateDefinition updateObj) {
        Mono<User> userFromRepository = repository
                .findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, id)));

        return userFromRepository.flatMap(existingUser -> repository.updateById(id, updateObj));
    }

    private Mono<User> update(User existingUser, User userUpdate) {

        // The password is being updated. Hash it first and then store it
        if (userUpdate.getPassword() != null) {
            userUpdate.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }

        return repository.updateById(existingUser.getId(), userUpdate, null);
    }

    private boolean validateName(String name) {
        /*
           Regex allows for Accented characters and alphanumeric with some special characters dot (.), apostrophe ('),
           hyphen (-) and spaces
        */
        return ALLOWED_ACCENTED_CHARACTERS_PATTERN.matcher(name).matches();
    }

    @Override
    public Mono<User> updateCurrentUser(final UserUpdateDTO allUpdates, ServerWebExchange exchange) {
        List<Mono<Void>> monos = new ArrayList<>();

        Mono<User> updatedUserMono;
        Mono<UserData> updatedUserDataMono;

        if (allUpdates.hasUserUpdates()) {
            final User updates = new User();
            String inputName = allUpdates.getName();
            boolean isValidName = validateName(inputName);
            if (!isValidName) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
            }
            updates.setName(inputName);
            // Set policies to null to avoid overriding them.
            updates.setPolicies(null);
            updatedUserMono = sessionUserService
                    .getCurrentUser()
                    .flatMap(user -> updateWithoutPermission(user.getId(), updates)
                            .then(
                                    exchange == null
                                            ? findByEmail(user.getEmail())
                                            : sessionUserService.refreshCurrentUser(exchange)))
                    .cache();
            monos.add(updatedUserMono.then());
        } else {
            updatedUserMono = sessionUserService.getCurrentUser().flatMap(user -> findByEmail(user.getEmail()));
        }

        if (allUpdates.hasUserDataUpdates()) {
            final UserData updates = new UserData();
            if (StringUtils.hasLength(allUpdates.getProficiency())) {
                updates.setProficiency(allUpdates.getProficiency());
            }
            if (StringUtils.hasLength(allUpdates.getUseCase())) {
                updates.setUseCase(allUpdates.getUseCase());
            }
            if (allUpdates.isIntercomConsentGiven()) {
                updates.setIntercomConsentGiven(true);
            }
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
    public Mono<Boolean> isUsersEmpty() {
        return repository.isUsersEmpty();
    }

    @Override
    public Mono<UserProfileDTO> buildUserProfileDTO(User user) {

        Mono<User> userFromDbMono = findByEmail(user.getEmail()).cache();

        Mono<Boolean> isSuperUserMono =
                userFromDbMono.flatMap(userUtils::isSuperUser).defaultIfEmpty(false);

        return Mono.zip(
                        isUsersEmpty(),
                        userFromDbMono,
                        userDataService.getForCurrentUser().defaultIfEmpty(new UserData()),
                        isSuperUserMono)
                .flatMap(tuple -> {
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
                    profile.setUseCase(userData.getUseCase());
                    profile.setPhotoId(userData.getProfilePhotoAssetId());
                    profile.setEnableTelemetry(!commonConfig.isTelemetryDisabled());
                    // Intercom consent is defaulted to true on cloud hosting
                    profile.setIntercomConsentGiven(
                            commonConfig.isCloudHosting() ? true : userData.isIntercomConsentGiven());
                    profile.setSuperUser(isSuperUser);
                    profile.setConfigurable(!StringUtils.isEmpty(commonConfig.getEnvFilePath()));
                    return pacConfigurationService.setRolesAndGroups(profile, userFromDb, true);
                });
    }

    private EmailTokenDTO parseValueFromEncryptedToken(String encryptedToken) {
        String decryptString = EncryptionHelper.decrypt(encryptedToken);
        List<NameValuePair> nameValuePairs = WWWFormCodec.parse(decryptString, StandardCharsets.UTF_8);
        Map<String, String> params = new HashMap<>();

        for (NameValuePair nameValuePair : nameValuePairs) {
            params.put(nameValuePair.getName(), nameValuePair.getValue());
        }
        return new EmailTokenDTO(params.get("email"), params.get("token"));
    }

    @Override
    public Flux<User> getAllByEmails(Set<String> emails, AclPermission permission) {
        return organizationService
                .getCurrentUserOrganizationId()
                .flatMapMany(organizationId -> repository.findAllByEmailInAndOrganizationId(emails, organizationId));
    }

    @Override
    public Mono<Boolean> resendEmailVerification(
            ResendEmailVerificationDTO resendEmailVerificationDTO, String redirectUrl) {

        if (resendEmailVerificationDTO.getEmail() == null
                || resendEmailVerificationDTO.getEmail().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.EMAIL));
        }

        if (resendEmailVerificationDTO.getBaseUrl() == null
                || resendEmailVerificationDTO.getBaseUrl().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        String email = resendEmailVerificationDTO.getEmail();

        // Create a random token to be sent out.
        final String token = UUID.randomUUID().toString();

        // Check if the user exists in our DB. If not, we will not send the email verification link to the user
        Mono<User> userMono = organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> repository
                        .findByEmailAndOrganizationId(email, organizationId)
                        .switchIfEmpty(repository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                                email, organizationId)))
                .cache();

        return userMono.switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)))
                .flatMap(user -> {
                    if (TRUE.equals(user.getEmailVerified())) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_ALREADY_VERIFIED));
                    }
                    return instanceVariablesHelper.isEmailVerificationEnabled().flatMap(emailVerificationEnabled -> {
                        // Email verification not enabled at instance level
                        if (!TRUE.equals(emailVerificationEnabled)) {
                            return Mono.error(new AppsmithException(AppsmithError.EMAIL_VERIFICATION_NOT_ENABLED));
                        }
                        return emailVerificationTokenRepository
                                .findByEmail(user.getEmail())
                                .switchIfEmpty(Mono.defer(() -> {
                                    // No existing email verification request
                                    EmailVerificationToken emailVerificationToken = new EmailVerificationToken();
                                    emailVerificationToken.setEmail(user.getEmail());
                                    emailVerificationToken.setTokenGeneratedAt(Instant.now());
                                    emailVerificationToken.setTokenHash(passwordEncoder.encode(token));
                                    emailVerificationToken.setOrganizationId(user.getOrganizationId());
                                    return Mono.just(emailVerificationToken);
                                }))
                                .map(emailVerificationToken -> {
                                    // generate new token and update in db
                                    emailVerificationToken.setTokenHash(passwordEncoder.encode(token));
                                    emailVerificationToken.setTokenGeneratedAt(Instant.now());
                                    emailVerificationToken.setOrganizationId(user.getOrganizationId());
                                    return emailVerificationToken;
                                });
                    });
                })
                .flatMap(emailVerificationTokenRepository::save)
                .zipWith(userMono)
                .flatMap(tuple -> {
                    EmailVerificationToken emailVerificationToken = tuple.getT1();
                    User user = tuple.getT2();
                    List<NameValuePair> nameValuePairs = new ArrayList<>(3);
                    nameValuePairs.add(new BasicNameValuePair("email", emailVerificationToken.getEmail()));
                    nameValuePairs.add(new BasicNameValuePair("token", token));
                    nameValuePairs.add(
                            new BasicNameValuePair("organizationId", emailVerificationToken.getOrganizationId()));
                    String urlParams = WWWFormCodec.format(nameValuePairs, StandardCharsets.UTF_8);
                    String redirectUrlCopy = redirectUrl;
                    if (redirectUrlCopy == null) {
                        redirectUrlCopy = String.format("%s/applications", resendEmailVerificationDTO.getBaseUrl());
                    }
                    String verificationUrl = String.format(
                            EMAIL_VERIFICATION_CLIENT_URL_FORMAT,
                            resendEmailVerificationDTO.getBaseUrl(),
                            EncryptionHelper.encrypt(urlParams),
                            URLEncoder.encode(emailVerificationToken.getEmail(), StandardCharsets.UTF_8),
                            emailVerificationToken.getOrganizationId(),
                            redirectUrlCopy);

                    return emailService.sendEmailVerificationEmail(
                            user, verificationUrl, resendEmailVerificationDTO.getBaseUrl());
                })
                .thenReturn(true);
    }

    private String getEmailVerificationErrorRedirectUrl(AppsmithError appsmithError, String userEmail, Object... args) {
        String appErrorCode = appsmithError.getAppErrorCode();
        String errorMessage = appsmithError.getMessage(args);
        errorMessage = errorMessage.replace(" ", "-").replace(".", "");
        return String.format(
                EMAIL_VERIFICATION_ERROR_URL_FORMAT,
                appErrorCode,
                errorMessage,
                URLEncoder.encode(userEmail, StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> verifyEmailVerificationToken(ServerWebExchange exchange) {
        return exchange.getFormData().flatMap(formData -> {
            final WebFilterExchange webFilterExchange = new WebFilterExchange(exchange, EMPTY_WEB_FILTER_CHAIN);
            EmailTokenDTO parsedEmailTokenDTO;
            String requestEmail = formData.getFirst("email");
            String requestedToken = formData.getFirst("token");
            String redirectUrl = formData.getFirst("redirectUrl");
            String organizationId = formData.getFirst("organizationId");
            String enableFirstTimeUserExperienceParam =
                    ObjectUtils.defaultIfNull(formData.getFirst("enableFirstTimeUserExperience"), "false");

            String baseUrl = exchange.getRequest().getHeaders().getOrigin();
            if (redirectUrl == null) {
                redirectUrl = baseUrl + DEFAULT_REDIRECT_URL;
            }

            String postVerificationRedirectUrl = "/signup-success?redirectUrl=" + redirectUrl
                    + "&enableFirstTimeUserExperience=" + enableFirstTimeUserExperienceParam;
            String errorRedirectUrl = "";

            if (requestEmail == null) {
                errorRedirectUrl =
                        getEmailVerificationErrorRedirectUrl(AppsmithError.INVALID_PARAMETER, "", FieldName.EMAIL);
                return redirectStrategy.sendRedirect(webFilterExchange.getExchange(), URI.create(errorRedirectUrl));
            }
            if (requestedToken == null) {
                errorRedirectUrl = getEmailVerificationErrorRedirectUrl(
                        AppsmithError.INVALID_PARAMETER, requestEmail, FieldName.TOKEN);
                return redirectStrategy.sendRedirect(webFilterExchange.getExchange(), URI.create(errorRedirectUrl));
            }

            try {
                parsedEmailTokenDTO = parseValueFromEncryptedToken(requestedToken);
            } catch (IllegalStateException | IllegalArgumentException e) {
                errorRedirectUrl =
                        getEmailVerificationErrorRedirectUrl(AppsmithError.INVALID_EMAIL_VERIFICATION, requestEmail);
                return redirectStrategy.sendRedirect(webFilterExchange.getExchange(), URI.create(errorRedirectUrl));
            }

            if (parsedEmailTokenDTO == null) {
                errorRedirectUrl =
                        getEmailVerificationErrorRedirectUrl(AppsmithError.INVALID_EMAIL_VERIFICATION, requestEmail);
                return redirectStrategy.sendRedirect(webFilterExchange.getExchange(), URI.create(errorRedirectUrl));
            }

            Mono<EmailVerificationToken> emailVerificationTokenMono = emailVerificationTokenRepository
                    .findByEmail(requestEmail)
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "email token")));

            Mono<User> userMono = repository
                    .findByEmailAndOrganizationId(requestEmail, organizationId)
                    .switchIfEmpty(
                            Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "user", requestEmail)));

            Mono<WebSession> sessionMono = exchange.getSession();

            Mono<SecurityContext> securityContextMono = ReactiveSecurityContextHolder.getContext();

            return Mono.zip(emailVerificationTokenMono, userMono, sessionMono, securityContextMono)
                    .flatMap(tuple -> {
                        EmailVerificationToken emailVerificationToken = tuple.getT1();
                        User user = tuple.getT2();
                        WebSession session = tuple.getT3();
                        SecurityContext securityContext = tuple.getT4();
                        String errorRedirectUrl1 = "";

                        if (!Objects.equals(emailVerificationToken.getEmail(), requestEmail)) {
                            errorRedirectUrl1 = getEmailVerificationErrorRedirectUrl(
                                    AppsmithError.INVALID_PARAMETER, requestEmail, FieldName.TOKEN);
                            return redirectStrategy.sendRedirect(
                                    webFilterExchange.getExchange(), URI.create(errorRedirectUrl1));
                        }

                        if (!Objects.equals(emailVerificationToken.getOrganizationId(), organizationId)) {
                            errorRedirectUrl1 = getEmailVerificationErrorRedirectUrl(
                                    AppsmithError.INVALID_PARAMETER, requestEmail, "Organization");
                            return redirectStrategy.sendRedirect(
                                    webFilterExchange.getExchange(), URI.create(errorRedirectUrl1));
                        }

                        if (FALSE.equals(isEmailVerificationTokenValid(emailVerificationToken))) {
                            errorRedirectUrl1 = getEmailVerificationErrorRedirectUrl(
                                    AppsmithError.EMAIL_VERIFICATION_TOKEN_EXPIRED, requestEmail);
                            return redirectStrategy.sendRedirect(
                                    webFilterExchange.getExchange(), URI.create(errorRedirectUrl1));
                        }

                        if (TRUE.equals(user.getEmailVerified())) {
                            errorRedirectUrl1 = getEmailVerificationErrorRedirectUrl(
                                    AppsmithError.USER_ALREADY_VERIFIED, requestEmail);
                            return redirectStrategy.sendRedirect(
                                    webFilterExchange.getExchange(), URI.create(errorRedirectUrl1));
                        }
                        Boolean tokenMatched = this.passwordEncoder.matches(
                                parsedEmailTokenDTO.getToken(), emailVerificationToken.getTokenHash());
                        if (!tokenMatched) {
                            errorRedirectUrl1 = getEmailVerificationErrorRedirectUrl(
                                    AppsmithError.INVALID_EMAIL_VERIFICATION, requestEmail);
                            return redirectStrategy.sendRedirect(
                                    webFilterExchange.getExchange(), URI.create(errorRedirectUrl1));
                        }

                        user.setEmailVerified(TRUE);
                        Authentication authentication =
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                        securityContext.setAuthentication(authentication);
                        // Save the security context in the session
                        ServerSecurityContextRepository contextRepository =
                                new WebSessionServerSecurityContextRepository();
                        return contextRepository.save(exchange, securityContext).then(repository.save(user));
                    })
                    .then(redirectStrategy.sendRedirect(
                            webFilterExchange.getExchange(), URI.create(postVerificationRedirectUrl)));
        });
    }
}
