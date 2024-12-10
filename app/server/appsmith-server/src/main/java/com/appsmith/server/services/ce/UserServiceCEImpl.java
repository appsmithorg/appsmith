package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.EmailVerificationToken;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
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
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.cakes.EmailVerificationTokenRepositoryCake;
import com.appsmith.server.repositories.cakes.PasswordResetTokenRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.PACConfigurationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.WWWFormCodec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
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
import static com.appsmith.server.constants.FieldName.DEFAULT;
import static com.appsmith.server.constants.FieldName.TENANT;
import static com.appsmith.server.helpers.RedirectHelper.DEFAULT_REDIRECT_URL;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.validateUserPassword;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Slf4j
public class UserServiceCEImpl extends BaseService<UserRepository, UserRepositoryCake, User, String>
        implements UserServiceCE {

    private final WorkspaceService workspaceService;
    private final SessionUserService sessionUserService;
    private final PasswordResetTokenRepositoryCake passwordResetTokenRepository;

    private final PasswordEncoder passwordEncoder;

    private final CommonConfig commonConfig;
    private final UserDataService userDataService;
    private final TenantService tenantService;
    private final UserUtils userUtils;
    private final EmailService emailService;
    private final RateLimitService rateLimitService;
    private final PACConfigurationService pacConfigurationService;

    private final UserServiceHelper userPoliciesComputeHelper;

    private static final WebFilterChain EMPTY_WEB_FILTER_CHAIN = serverWebExchange -> Mono.empty();
    private static final String FORGOT_PASSWORD_CLIENT_URL_FORMAT = "%s/user/resetPassword?token=%s";
    private static final Pattern ALLOWED_ACCENTED_CHARACTERS_PATTERN = Pattern.compile("^[\\p{L} 0-9 .\'\\-]+$");

    private static final String EMAIL_VERIFICATION_CLIENT_URL_FORMAT =
            "%s/user/verify?token=%s&email=%s&redirectUrl=%s";

    private static final String EMAIL_VERIFICATION_ERROR_URL_FORMAT = "/user/verify-error?code=%s&message=%s&email=%s";
    private final EmailVerificationTokenRepositoryCake emailVerificationTokenRepository;

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    @Autowired
    public UserServiceCEImpl(
            Validator validator,
            UserRepository repositoryDirect,
            UserRepositoryCake repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PasswordResetTokenRepositoryCake passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            CommonConfig commonConfig,
            UserDataService userDataService,
            TenantService tenantService,
            UserUtils userUtils,
            EmailVerificationTokenRepositoryCake emailVerificationTokenRepository,
            EmailService emailService,
            RateLimitService rateLimitService,
            PACConfigurationService pacConfigurationService,
            UserServiceHelper userServiceHelper) {

        super(validator, repositoryDirect, repository, analyticsService);
        this.workspaceService = workspaceService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.commonConfig = commonConfig;
        this.userDataService = userDataService;
        this.tenantService = tenantService;
        this.userUtils = userUtils;
        this.rateLimitService = rateLimitService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.emailService = emailService;
        this.userPoliciesComputeHelper = userServiceHelper;
        this.pacConfigurationService = pacConfigurationService;
    }

    @Override
    public Mono<User> findByEmail(String email) {
        return tenantService.getDefaultTenantId().flatMap(tenantId -> findByEmailAndTenantId(email, tenantId));
    }

    @Override
    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        return repository.findByEmailAndTenantId(email, tenantId);
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
        return repository
                .findByEmail(email)
                .switchIfEmpty(repository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(email))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)))
                .flatMap(user -> {
                    // an user found with the provided email address
                    // Generate the password reset link for the user
                    return passwordResetTokenRepository
                            .findByEmail(user.getEmail())
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

        Mono<Tenant> tenantMono = tenantService
                .getDefaultTenant()
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, DEFAULT, TENANT)));

        return passwordResetTokenRepository
                .findByEmail(emailTokenDTO.getEmail())
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
                .flatMap(emailAddress -> repository
                        .findByEmail(emailAddress)
                        .switchIfEmpty(Mono.error(
                                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, emailAddress)))
                        .zipWith(tenantMono)
                        .flatMap(tuple -> {
                            User userFromDb = tuple.getT1();
                            TenantConfiguration tenantConfiguration =
                                    tuple.getT2().getTenantConfiguration();
                            boolean isStrongPasswordPolicyEnabled = tenantConfiguration != null
                                    && Boolean.TRUE.equals(tenantConfiguration.getIsStrongPasswordPolicyEnabled());

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

                            return passwordResetTokenRepository
                                    .findByEmail(userFromDb.getEmail())
                                    .switchIfEmpty(Mono.error(new AppsmithException(
                                            AppsmithError.NO_RESOURCE_FOUND,
                                            FieldName.TOKEN,
                                            emailTokenDTO.getToken())))
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
                                                        RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API,
                                                        userFromDb.getEmail())
                                                .subscribeOn(Schedulers.boundedElastic())
                                                .subscribe();
                                    })
                                    .thenReturn(true);
                        }));
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

        Mono<User> userWithTenantMono = Mono.just(user).flatMap(userBeforeSave -> {
            if (userBeforeSave.getTenantId() == null) {
                return tenantService.getDefaultTenantId().map(tenantId -> {
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
                .flatMap(this::addUserPoliciesAndSaveToRepo)
                .flatMap(crudUser -> {
                    if (isAdminUser) {
                        return userUtils.makeSuperUser(List.of(crudUser)).then(Mono.just(crudUser));
                    }
                    return Mono.just(crudUser);
                })
                .then(Mono.zip(
                        repository.findByEmail(user.getUsername()),
                        userDataService.getForUserEmail(user.getUsername())))
                .flatMap(tuple -> analyticsService.identifyUser(tuple.getT1(), tuple.getT2()));
    }

    private Mono<User> addUserPoliciesAndSaveToRepo(User user) {
        return userPoliciesComputeHelper.addPoliciesToUser(user).flatMap(repository::save);
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
        return repository
                .findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(user.getUsername())
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
                    return Mono.error(
                            new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_SIGNUP, savedUser.getUsername()));
                })
                .switchIfEmpty(Mono.defer(() -> {
                    return signupIfAllowed(user)
                            .flatMap(savedUser -> {
                                final UserSignupDTO userSignupDTO = new UserSignupDTO();
                                userSignupDTO.setUser(savedUser);

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
     * This function creates a new user in the system. Primarily used by new users signing up for the first time on the
     * platform. This flow also ensures that a default workspace name is created for the user. The new user is then
     * given admin permissions to the default workspace.
     * <p>
     * For new user invite flow, please {@link com.appsmith.server.solutions.UserAndAccessManagementService#inviteUsers(InviteUsersDTO, String)}
     *
     * @param user User object representing the user to be created/enabled.
     * @return Publishes the user object, after having been saved.
     */
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
        return userCreate(user, isAdminUser).elapsed().map(pair -> {
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
    public Mono<Integer> updateWithoutPermission(String id, BridgeUpdate updateObj) {
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
                                            ? repository.findByEmail(user.getEmail())
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

        Mono<Boolean> isSuperUserMono = userFromDbMono.flatMap(userUtils::isSuperUser);

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
                    return pacConfigurationService.setRolesAndGroups(
                            profile, userFromDb, true, commonConfig.isCloudHosting());
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
        return repository.findAllByEmailIn(emails);
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
        Mono<User> userMono = repository.findByEmail(email).cache();
        return userMono.switchIfEmpty(repository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(email))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, email)))
                .flatMap(user -> {
                    if (TRUE.equals(user.getEmailVerified())) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_ALREADY_VERIFIED));
                    }
                    return tenantService.getTenantConfiguration().flatMap(tenant -> {
                        Boolean emailVerificationEnabled =
                                tenant.getTenantConfiguration().isEmailVerificationEnabled();
                        // Email verification not enabled at tenant
                        if (!TRUE.equals(emailVerificationEnabled)) {
                            return Mono.error(
                                    new AppsmithException(AppsmithError.TENANT_EMAIL_VERIFICATION_NOT_ENABLED));
                        }
                        return emailVerificationTokenRepository
                                .findByEmail(user.getEmail())
                                .switchIfEmpty(Mono.defer(() -> {
                                    // No existing email verification request
                                    EmailVerificationToken emailVerificationToken = new EmailVerificationToken();
                                    emailVerificationToken.setEmail(user.getEmail());
                                    emailVerificationToken.setTokenGeneratedAt(Instant.now());
                                    emailVerificationToken.setTokenHash(passwordEncoder.encode(token));
                                    return Mono.just(emailVerificationToken);
                                }))
                                .map(emailVerificationToken -> {
                                    // generate new token and update in db
                                    emailVerificationToken.setTokenHash(passwordEncoder.encode(token));
                                    emailVerificationToken.setTokenGeneratedAt(Instant.now());
                                    return emailVerificationToken;
                                });
                    });
                })
                .flatMap(emailVerificationTokenRepository::save)
                .zipWith(userMono)
                .flatMap(tuple -> {
                    EmailVerificationToken emailVerificationToken = tuple.getT1();
                    User user = tuple.getT2();
                    List<NameValuePair> nameValuePairs = new ArrayList<>(2);
                    nameValuePairs.add(new BasicNameValuePair("email", emailVerificationToken.getEmail()));
                    nameValuePairs.add(new BasicNameValuePair("token", token));
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
            } catch (ArrayIndexOutOfBoundsException | IllegalStateException | IllegalArgumentException e) {
                errorRedirectUrl = getEmailVerificationErrorRedirectUrl(
                        AppsmithError.INVALID_PARAMETER, requestEmail, FieldName.TOKEN);
                return redirectStrategy.sendRedirect(webFilterExchange.getExchange(), URI.create(errorRedirectUrl));
            }

            Mono<WebSession> sessionMono = exchange.getSession();
            Mono<SecurityContext> securityContextMono = ReactiveSecurityContextHolder.getContext();
            Mono<User> userMono = repository.findByEmail(parsedEmailTokenDTO.getEmail());

            Mono<EmailVerificationToken> emailVerificationTokenMono = emailVerificationTokenRepository
                    .findByEmail(parsedEmailTokenDTO.getEmail())
                    .defaultIfEmpty(new EmailVerificationToken());

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

                        Authentication authentication =
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                        securityContext.setAuthentication(authentication);
                        session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, securityContext);

                        user.setEmailVerified(TRUE);
                        Mono<Void> redirectionMono = redirectStrategy.sendRedirect(
                                webFilterExchange.getExchange(), URI.create(postVerificationRedirectUrl));
                        return repository.save(user).then(redirectionMono);
                    });
        });
    }
}
