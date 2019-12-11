package com.appsmith.server.services;

import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.BeanCopyUtils;
import com.appsmith.server.notifications.EmailSender;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final GroupService groupService;

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
                           GroupService groupService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.organizationService = organizationService;
        this.analyticsService = analyticsService;
        this.sessionUserService = sessionUserService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.groupService = groupService;
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
     * This function adds an organizationId to the user. This will allow users to switch between multiple organizations
     * and operate inside them independently.
     *
     * @param orgId The organizationId being added to the user.
     * @param user
     * @return
     */
    @Override
    public Mono<User> addUserToOrganization(String orgId, User user) {

        Mono<User> currentUserMono;
        if (user == null) {
            currentUserMono = sessionUserService.getCurrentUser();
        } else {
            currentUserMono = Mono.just(user);
        }

        return organizationService.findById(orgId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "organization", orgId)))
                .zipWith(currentUserMono)
                .map(tuple -> {
                    Organization organization = tuple.getT1();
                    User user1 = tuple.getT2();
                    log.debug("Adding organization {} with id {} to user {}", organization.getName(), organization.getId(), user.getEmail());
                    return user1;
                })
                .map(user1 -> {
                    Set<String> organizationIds = user1.getOrganizationIds();
                    if (organizationIds == null) {
                        organizationIds = new HashSet<>();
                        if (user1.getCurrentOrganizationId() != null) {
                            // If the list of organizationIds for a user is null, add the current user org
                            // to the new list as well
                            organizationIds.add(user1.getCurrentOrganizationId());
                        }
                    }
                    if (!organizationIds.contains(orgId)) {
                        // Only add to the organizationIds array if it's not already present
                        organizationIds.add(orgId);
                        user1.setOrganizationIds(organizationIds);
                    }
                    // Set the current organization to the newly added organization
                    user1.setCurrentOrganizationId(orgId);
                    return user1;
                })
                .flatMap(repository::save);
    }

    /**
     * This function creates a one-time token for resetting the user's password. This token is stored in the `passwordResetToken`
     * collection with an expiry time of 1 hour. The user must provide this one-time token when updating with the new password.
     *
     * @param email The email ID of the user initiating the password reset request
     * @return
     */
    @Override
    public Mono<Boolean> forgotPasswordTokenGenerate(String email) {
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setEmail(email);
        // Create a random token to be sent out.
        String token = UUID.randomUUID().toString();
        log.debug("Password reset Token: {} for email: {}", token, email);

        passwordResetToken.setTokenHash(passwordEncoder.encode(token));
        return passwordResetTokenRepository
                .save(passwordResetToken)
                .map(obj -> {
                    emailSender.sendMail(email, "Appsmith Password Reset", "Token: " + token);
                    return Mono.empty();
                })
                .thenReturn(true);
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "token", email)))
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
                    return passwordResetTokenRepository
                            .findByEmail(user.getEmail())
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "token", token)))
                            .flatMap(passwordResetTokenRepository::delete)
                            .thenReturn(userFromDb)
                            .flatMap(repository::save)
                            .thenReturn(true);
                });
    }

    @Override
    public Mono<User> create(User user) {
        user.setPassword(this.passwordEncoder.encode(user.getPassword()));

        Organization personalOrg = new Organization();
        String name;
        if (user.getName() != null) {
            name = user.getName();
        } else {
            name = user.getEmail();
        }
        personalOrg.setName(name + "'s Personal Workspace");

        Mono<Organization> savedOrganizationMono = organizationService.create(personalOrg);

        Mono<User> savedUserMono = super.create(user);

        return Mono.zip(savedOrganizationMono, savedUserMono)
                //Once the two monos finish emitting, the user and the organization have been saved to the db
                .flatMap(tuple -> {
                    Organization savedOrg = tuple.getT1();
                    User savedUser = tuple.getT2();

                    Flux<Group> groupsFlux = groupService.getByOrganizationId(savedOrg.getId());
                    return groupsFlux
                            .collect(Collectors.toSet())
                            .map(groups -> {
                                // Set the default group Ids for the user
                                Set<String> groupIds = groups.stream().map(group -> group.getId()).collect(Collectors.toSet());
                                savedUser.setGroupIds(groupIds);
                                return savedUser;
                            })
                            // At this point both the user and the organization have been saved. Now add the newly created
                            // organization to the newly created user.
                            .flatMap(user1 -> addUserToOrganization(savedOrg.getId(), user1));
                })
                .flatMap(analyticsService::trackNewUser);
    }

    @Override
    public Mono<User> update(String id, User userUpdate) {
        Mono<User> userFromRepository = repository.findById(id);

        if (userUpdate.getPassword() != null) {
            // The password is being updated. Hash it first and then store it
            userUpdate.setPassword(passwordEncoder.encode(userUpdate.getPassword()));
        }

        return Mono.just(userUpdate)
                .flatMap(this::validateUpdate)
                //Once the new update has been validated, update the user with the new fields.
                .then(userFromRepository)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, id)))
                .map(existingUser -> {
                    BeanCopyUtils.copyNewFieldValuesIntoOldObject(userUpdate, existingUser);
                    return existingUser;
                })
                .flatMap(repository::save);
    }

    //Validation for user update. Right now it only validates the organization id. Other checks can be added
    //here in the future.
    private Mono<User> validateUpdate(User updateUser) {
        if (updateUser.getCurrentOrganizationId() == null) {
            //No organization present implies the update to the user is not to the organization id. No checks currently
            //for this scenario. Return the user successfully.
            return Mono.just(updateUser);
        }
        return organizationService.findById(updateUser.getCurrentOrganizationId())
                //If the organization is not found in the repository, throw an error
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, updateUser.getCurrentOrganizationId())))
                .then(Mono.just(updateUser));
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
}
