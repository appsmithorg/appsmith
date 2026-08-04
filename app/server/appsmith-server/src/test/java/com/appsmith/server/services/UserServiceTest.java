package com.appsmith.server.services;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResendEmailVerificationDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.SecureBaseUrlResolver;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.EmailVerificationTokenRepository;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.WWWFormCodec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.constants.AccessControlConstants.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;
import static com.appsmith.server.constants.Appsmith.DEFAULT_ORIGIN_HEADER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@Slf4j
@SpringBootTest
@DirtiesContext
public class UserServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    UserDataService userDataService;

    @MockBean
    PasswordResetTokenRepository passwordResetTokenRepository;

    @MockBean
    EmailVerificationTokenRepository emailVerificationTokenRepository;

    // Spied so forgot-password tests can pin a resolved base URL and verify email dispatch without
    // actually sending mail. Real behaviour is preserved for every other test in this class.
    @SpyBean
    SecureBaseUrlResolver secureBaseUrlResolver;

    @SpyBean
    EmailService emailService;

    // Mocked so the in-service per-email resend throttle does not reach Redis in these unit tests; the
    // throttle's real behaviour (limit trigger + non-distinguishability) is covered against a Redis
    // testcontainer in UserServiceResendEmailVerificationRateLimitTest. Defaults to "within limit".
    @MockBean
    RateLimitService rateLimitService;

    // Spied so the resend "verification disabled" test can pin the real gate — email verification is gated
    // on InstanceVariablesHelper.isEmailVerificationEnabled (the instance-variables config), not the
    // OrganizationConfiguration. Real behaviour is preserved for every other test.
    @SpyBean
    InstanceVariablesHelper instanceVariablesHelper;

    @Autowired
    OrganizationService organizationService;

    Mono<User> userMono;

    @Autowired
    UserSignup userSignup;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @SpyBean
    CommonConfig commonConfig;

    @BeforeEach
    public void setup() {
        userMono = userService.findByEmail("usertest@usertest.com");
        // Default the resend per-email throttle to "within limit" so it is transparent to tests that are
        // not specifically exercising it.
        Mockito.lenient()
                .when(rateLimitService.tryIncreaseCounter(
                        Mockito.eq(RateLimitConstants.BUCKET_KEY_FOR_RESEND_EMAIL_VERIFICATION_API), any()))
                .thenReturn(Mono.just(true));
    }
    // Test the update workspace flow.
    @Test
    public void updateInvalidUserWithAnything() {
        User updateUser = new User();
        updateUser.setName("Random User whose updates don't matter");

        User existingUser = new User();
        existingUser.setId("Random-UserId-%Not-In_The-System_For_SUre");

        Mono<User> userMono1 = Mono.just(existingUser).flatMap(user -> userService.update(user.getId(), updateUser));

        StepVerifier.create(userMono1)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.USER, "Random-UserId-%Not-In_The-System_For_SUre")))
                .verify();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserFormSignupNullPassword() {
        User newUser = new User();
        newUser.setEmail("new-user-email-with-null-password@email.com");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_CREDENTIALS.getMessage()))
                .verify();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserValid() {
        User newUser = new User();
        newUser.setEmail("new-user-email@email.com");
        newUser.setPassword("new-user-test-password");

        Mono<User> userCreateMono = userService.create(newUser).cache();

        Mono<PermissionGroup> permissionGroupMono = userCreateMono.flatMap(user -> {
            Set<Policy> userPolicies = user.getPolicies();
            assertThat(userPolicies.size()).isNotZero();
            Optional<Policy> optionalResetPasswordPolicy = userPolicies.stream()
                    .filter(policy1 -> policy1.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                    .findFirst();
            assertThat(optionalResetPasswordPolicy.isPresent()).isTrue();
            assertThat(optionalResetPasswordPolicy.get().getPermissionGroups()).isNotEmpty();
            String permissionGroupId = optionalResetPasswordPolicy.get().getPermissionGroups().stream()
                    .findFirst()
                    .get();

            return permissionGroupRepository.findById(permissionGroupId);
        });

        StepVerifier.create(Mono.zip(userCreateMono, permissionGroupMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1();
                    PermissionGroup permissionGroup = tuple.getT2();

                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("new-user-email@email.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getOrganizationId()).isNotNull();

                    Set<Policy> userPolicies = user.getPolicies();
                    Optional<Policy> optionalManageUserPolicy = userPolicies.stream()
                            .filter(policy -> MANAGE_USERS.getValue().equals(policy.getPermission()))
                            .findFirst();
                    Optional<Policy> optionalViewUserPolicy = userPolicies.stream()
                            .filter(policy -> MANAGE_USERS.getValue().equals(policy.getPermission()))
                            .findFirst();
                    assertThat(optionalManageUserPolicy.isPresent()).isTrue();
                    assertThat(optionalManageUserPolicy.get().getPermissionGroups())
                            .contains(permissionGroup.getId());
                    assertThat(optionalViewUserPolicy.isPresent()).isTrue();
                    assertThat(optionalViewUserPolicy.get().getPermissionGroups())
                            .contains(permissionGroup.getId());
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(user.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUser_WhenEmailHasUpperCase_SavedInLowerCase() {
        String sampleEmail = "User-email@Email.cOm";
        String sampleEmailLowercase = sampleEmail.toLowerCase();

        User newUser = new User();
        newUser.setEmail(sampleEmail);
        newUser.setPassword("new-user-test-password");

        Mono<User> userCreateMono = userService.create(newUser).cache();

        Mono<PermissionGroup> permissionGroupMono = userCreateMono.flatMap(user -> {
            Set<Policy> userPolicies = user.getPolicies();
            assertThat(userPolicies.size()).isNotZero();
            Optional<Policy> optionalResetPasswordPolicy = userPolicies.stream()
                    .filter(policy1 -> policy1.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                    .findFirst();
            assertThat(optionalResetPasswordPolicy.isPresent()).isTrue();
            assertThat(optionalResetPasswordPolicy.get().getPermissionGroups()).isNotEmpty();
            String permissionGroupId = optionalResetPasswordPolicy.get().getPermissionGroups().stream()
                    .findFirst()
                    .get();

            return permissionGroupRepository.findById(permissionGroupId);
        });

        StepVerifier.create(Mono.zip(userCreateMono, permissionGroupMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1();
                    PermissionGroup permissionGroup = tuple.getT2();

                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(sampleEmailLowercase);
                    assertThat(user.getName()).isNullOrEmpty();

                    Set<Policy> userPolicies = user.getPolicies();
                    Optional<Policy> optionalManageUserPolicy = userPolicies.stream()
                            .filter(policy -> MANAGE_USERS.getValue().equals(policy.getPermission()))
                            .findFirst();
                    Optional<Policy> optionalViewUserPolicy = userPolicies.stream()
                            .filter(policy -> MANAGE_USERS.getValue().equals(policy.getPermission()))
                            .findFirst();
                    assertThat(optionalManageUserPolicy.isPresent()).isTrue();
                    assertThat(optionalManageUserPolicy.get().getPermissionGroups())
                            .contains(permissionGroup.getId());
                    assertThat(optionalViewUserPolicy.isPresent()).isTrue();
                    assertThat(optionalViewUserPolicy.get().getPermissionGroups())
                            .contains(permissionGroup.getId());
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(user.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUser_WhenEmailHasInvisibleUnicode_SavedNormalized() {
        String dirtyEmail = "\u2060new-invisible-char-user@example.com";
        String expectedCleanEmail = "new-invisible-char-user@example.com";

        User newUser = new User();
        newUser.setEmail(dirtyEmail);
        newUser.setPassword("test-password-123");

        Mono<User> userCreateMono = userService.create(newUser);

        StepVerifier.create(userCreateMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(expectedCleanEmail);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUser_WhenEmailHasMultipleDirtyChars_SavedFullyNormalized() {
        String dirtyEmail = "  \u200B\u200CNew-Multi-Dirty@Example\uFEFF.COM  ";
        String expectedCleanEmail = "new-multi-dirty@example.com";

        User newUser = new User();
        newUser.setEmail(dirtyEmail);
        newUser.setPassword("test-password-123");

        Mono<User> userCreateMono = userService.create(newUser);

        StepVerifier.create(userCreateMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(expectedCleanEmail);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUser_WhenCleanEmail_SavedUnchanged() {
        String cleanEmail = "clean-email-unchanged@example.com";

        User newUser = new User();
        newUser.setEmail(cleanEmail);
        newUser.setPassword("test-password-123");

        Mono<User> userCreateMono = userService.create(newUser);

        StepVerifier.create(userCreateMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(cleanEmail);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaFormLogin_WhenEmailHasInvisibleUnicode_SavedNormalized() {
        String dirtyEmail = "\u200Bform-signup-dirty@example.com";
        String expectedCleanEmail = "form-signup-dirty@example.com";

        User signupUser = new User();
        signupUser.setEmail(dirtyEmail);
        signupUser.setPassword("test-password-123");
        signupUser.setSource(LoginSource.FORM);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getEmail()).isEqualTo(expectedCleanEmail);
                    assertThat(user.getSource()).isEqualTo(LoginSource.FORM);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaGoogle_WhenEmailHasInvisibleUnicode_SavedNormalized() {
        String dirtyEmail = "\u2060google-signup-dirty@example.com";
        String expectedCleanEmail = "google-signup-dirty@example.com";

        User signupUser = new User();
        signupUser.setEmail(dirtyEmail);
        signupUser.setPassword("test-password-123");
        signupUser.setSource(LoginSource.GOOGLE);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getEmail()).isEqualTo(expectedCleanEmail);
                    assertThat(user.getSource()).isEqualTo(LoginSource.GOOGLE);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaFormLoginIfAlreadyInvited() {
        User newUser = new User();
        newUser.setEmail("alreadyInvited@alreadyInvited.com");
        newUser.setIsEnabled(false);

        userRepository.save(newUser).block();

        User signupUser = new User();
        signupUser.setEmail(newUser.getEmail());
        signupUser.setPassword("password");
        signupUser.setSource(LoginSource.FORM);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals(newUser.getEmail().toLowerCase(), user.getEmail());
                    assertEquals(LoginSource.FORM, user.getSource());
                    assertThat(user.getIsEnabled()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaGoogleIfAlreadyInvited() {
        User newUser = new User();
        newUser.setEmail("alreadyInvited@google-gmail.com");
        newUser.setIsEnabled(false);

        userRepository.save(newUser).block();

        User signupUser = new User();
        signupUser.setEmail(newUser.getEmail());
        signupUser.setPassword("password");
        signupUser.setSource(LoginSource.GOOGLE);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals(newUser.getEmail().toLowerCase(), user.getEmail());
                    assertEquals(LoginSource.GOOGLE, user.getSource());
                    assertTrue(user.getIsEnabled());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void signUpAfterBeingInvitedToAppsmithWorkspace() {
        Workspace workspace = new Workspace();
        workspace.setName("SignUp after adding user to Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService.create(workspace).cache();

        String newUserEmail = "inviteUserToApplicationWithoutExisting@test.com";

        workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add(newUserEmail);
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setPermissionGroupId(workspace1.getDefaultPermissionGroups().stream()
                            .findFirst()
                            .get());

                    return userAndAccessManagementService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                })
                .block();

        // Now Sign Up as the new user
        User signUpUser = new User();
        signUpUser.setEmail(newUserEmail);
        signUpUser.setPassword("123456");

        Mono<User> invitedUserSignUpMono = userService.createUser(signUpUser).map(UserSignupDTO::getUser);

        StepVerifier.create(invitedUserSignUpMono)
                .assertNext(user -> {
                    assertTrue(user.getIsEnabled());
                    assertTrue(passwordEncoder.matches("123456", user.getPassword()));
                })
                .verifyComplete();

        workspaceMono
                .flatMap(workspace1 -> workspaceService.archiveById(workspace1.getId()))
                .block();
    }

    @Test
    public void createUserWithInvalidEmailAddress() {
        List<String> invalidAddresses = Arrays.asList(
                "plainaddress",
                "#@%^%#$@#$@#.com",
                "@example.com",
                "Joe Smith <email@example.com>",
                "email.example.com",
                "email@example@example.com",
                ".email@example.com",
                "email.@example.com",
                "email..email@example.com",
                "email@example.com (Joe Smith)",
                "email@-example.com",
                "email@example..com",
                "Abc..123@example.com");
        for (String invalidAddress : invalidAddresses) {
            User user = new User();
            user.setEmail(invalidAddress);
            user.setPassword("test-password");
            user.setName("test-name");
            StepVerifier.create(userSignup.signupAndLogin(user, null))
                    .expectErrorMessage(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.EMAIL))
                    .verify();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("New name of api user");
        StepVerifier.create(userService.updateCurrentUser(updateUser, null))
                .assertNext(user -> {
                    assertNotNull(user);
                    assertEquals("api_user", user.getEmail());
                    assertEquals("New name of api user", user.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameOfUser_WithNotAllowedSpecialCharacter_InvalidName() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("invalid name@symbol");
        StepVerifier.create(userService.updateCurrentUser(updateUser, null))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameOfUser_WithAccentedCharacters_IsValid() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("ä ö ü è ß Test .  '- ðƒ 你好 123'");
        StepVerifier.create(userService.updateCurrentUser(updateUser, null))
                .assertNext(user -> {
                    assertNotNull(user);
                    assertEquals("ä ö ü è ß Test .  '- ðƒ 你好 123'", user.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateIntercomConsentOfUser() {
        final Mono<UserData> userDataMono = userDataService.getForUserEmail("api_user");
        StepVerifier.create(userDataMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.getIsIntercomConsentGiven()).isFalse();
                })
                .verifyComplete();

        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setIsIntercomConsentGiven(true);
        final Mono<UserData> updateToTrueMono =
                userService.updateCurrentUser(updateUser, null).then(userDataMono);
        StepVerifier.create(updateToTrueMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.getIsIntercomConsentGiven()).isTrue();
                })
                .verifyComplete();

        updateUser.setIsIntercomConsentGiven(false);
        final Mono<UserData> updateToFalseAfterTrueMono =
                userService.updateCurrentUser(updateUser, null).then(userDataMono);
        StepVerifier.create(updateToFalseAfterTrueMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.getIsIntercomConsentGiven()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getIntercomConsentOfUserOnCloudHosting_AlwaysTrue() {
        Mockito.when(commonConfig.getIsCloudHosting()).thenReturn(true);

        Mono<UserProfileDTO> userProfileDTOMono =
                sessionUserService.getCurrentUser().flatMap(userService::buildUserProfileDTO);

        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO -> {
                    assertNotNull(userProfileDTO);
                    assertThat(userProfileDTO.getIsIntercomConsentGiven()).isTrue();
                    assertEquals(
                            List.of(
                                    UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC),
                            userProfileDTO.getGroups());
                    assertEquals(
                            List.of(
                                    UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC),
                            userProfileDTO.getRoles());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameAndUseCaseOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("New name of user here");
        updateUser.setUseCase("New use case");
        final Mono<Tuple2<User, UserData>> resultMono = userService
                .updateCurrentUser(updateUser, null)
                .flatMap(user -> Mono.zip(Mono.just(user), userDataService.getForUserEmail("api_user")));
        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    final User user = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    assertNotNull(user);
                    assertNotNull(userData);
                    assertEquals("New name of user here", user.getName());
                    assertEquals("New use case", userData.getUseCase());
                })
                .verifyComplete();
    }

    /**
     * Regression for the secondary enumeration oracle (CWE-204, GHSA-fvrq-g89c-fgg6): a known account
     * driven over its reset limit (4th request within 24h) previously surfaced HTTP 429
     * (TOO_MANY_REQUESTS), which distinguished it from the HTTP 200 generic success returned for an
     * unknown email. The over-limit case must now return the same generic success, must NOT send another
     * reset email, and must NOT persist a fresh (usable) reset token — while the request-count tracking
     * still keeps the limit in force.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void forgotPasswordTokenGenerate_whenKnownAccountOverResetLimit_returnsGenericSuccessWithoutSendingEmail() {
        String baseUrl = "https://my-instance.example.com";
        String knownEmail = "api_user";

        Mockito.doReturn(Mono.just(baseUrl)).when(secureBaseUrlResolver).resolveSecureBaseUrl(baseUrl);

        // Existing token that is already over the limit (3 requests) within the 24h window.
        PasswordResetToken overLimitToken = new PasswordResetToken();
        overLimitToken.setEmail(knownEmail);
        overLimitToken.setRequestCount(3);
        overLimitToken.setFirstRequestTime(Instant.now());
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.just(overLimitToken));
        Mockito.when(passwordResetTokenRepository.save(any()))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        Mockito.doReturn(Mono.just(true)).when(emailService).sendForgotPasswordEmail(any(), any(), any());

        ResetUserPasswordDTO dto = new ResetUserPasswordDTO();
        dto.setEmail(knownEmail);
        dto.setBaseUrl(baseUrl);

        // Same generic success as the under-limit and unknown cases — no distinguishable 429.
        StepVerifier.create(userService.forgotPasswordTokenGenerate(dto))
                .expectNext(true)
                .verifyComplete();

        // Anti-spam: over the limit, no new email is sent and no fresh reset token is persisted.
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(any(), any(), any());
        Mockito.verify(passwordResetTokenRepository, Mockito.never()).save(any());
    }

    /**
     * Full anti-enumeration invariant across all three branches: a known email under its reset limit, the
     * same known email over its limit, and an unknown email must all return the identical generic success
     * (HTTP 200, {@code {"data": true}}). Only the under-limit case may send an email or persist a token.
     * NOTE: a timing side-channel can still remain because the under-limit path does more work; equalizing
     * timing is intentionally out of scope for this fix — identical status + body is the bar being enforced.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void forgotPasswordTokenGenerate_underLimit_overLimit_andUnknown_returnIdenticalGenericSuccess() {
        String baseUrl = "https://my-instance.example.com";
        String knownEmail = "api_user";
        String unknownEmail = "no-such-user-" + UUID.randomUUID() + "@example.com";

        Mockito.doReturn(Mono.just(baseUrl)).when(secureBaseUrlResolver).resolveSecureBaseUrl(baseUrl);
        Mockito.when(passwordResetTokenRepository.save(any()))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        Mockito.doReturn(Mono.just(true)).when(emailService).sendForgotPasswordEmail(any(), any(), any());

        ResetUserPasswordDTO knownDto = new ResetUserPasswordDTO();
        knownDto.setEmail(knownEmail);
        knownDto.setBaseUrl(baseUrl);

        ResetUserPasswordDTO unknownDto = new ResetUserPasswordDTO();
        unknownDto.setEmail(unknownEmail);
        unknownDto.setBaseUrl(baseUrl);

        // 1) Known, under limit: existing token with 1 request in the window -> success + email + save.
        PasswordResetToken underLimitToken = new PasswordResetToken();
        underLimitToken.setEmail(knownEmail);
        underLimitToken.setRequestCount(1);
        underLimitToken.setFirstRequestTime(Instant.now());
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.just(underLimitToken));

        StepVerifier.create(userService.forgotPasswordTokenGenerate(knownDto))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.times(1)).sendForgotPasswordEmail(eq(knownEmail), any(), eq(baseUrl));
        Mockito.verify(passwordResetTokenRepository, Mockito.times(1)).save(any());

        // 2) Known, over limit: existing token with 3 requests in the window -> success, no email, no save.
        Mockito.clearInvocations(emailService, passwordResetTokenRepository);
        PasswordResetToken overLimitToken = new PasswordResetToken();
        overLimitToken.setEmail(knownEmail);
        overLimitToken.setRequestCount(3);
        overLimitToken.setFirstRequestTime(Instant.now());
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.just(overLimitToken));

        StepVerifier.create(userService.forgotPasswordTokenGenerate(knownDto))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(any(), any(), any());
        Mockito.verify(passwordResetTokenRepository, Mockito.never()).save(any());

        // 3) Unknown email: user lookup empty -> success, no email, no token persisted.
        Mockito.clearInvocations(emailService, passwordResetTokenRepository);
        StepVerifier.create(userService.forgotPasswordTokenGenerate(unknownDto))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(any(), any(), any());
        Mockito.verify(passwordResetTokenRepository, Mockito.never()).save(any());
    }

    /**
     * Anti-enumeration invariant (CWE-204, GHSA-fvrq-g89c-fgg6): the forgot-password flow must return
     * the exact same generic success (HTTP 200, {@code {"data": true}}) for a non-existent email as it
     * does for a registered one, so an unauthenticated caller cannot distinguish valid from invalid
     * accounts. A reset email must be dispatched only for the account that actually exists.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void forgotPasswordTokenGenerate_unknownEmail_isIndistinguishableFromKnownEmailAndSendsNoEmail() {
        String baseUrl = "https://my-instance.example.com";
        String knownEmail = "api_user";
        String unknownEmail = "no-such-user-" + UUID.randomUUID() + "@example.com";

        // Pin a resolved base URL so the flow proceeds past the secure base URL resolver to the user lookup.
        Mockito.doReturn(Mono.just(baseUrl)).when(secureBaseUrlResolver).resolveSecureBaseUrl(baseUrl);

        // No pre-existing reset token; save echoes back the token it is given.
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.empty());
        Mockito.when(passwordResetTokenRepository.save(any()))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // Stub email dispatch so the valid path does not attempt to send a real email.
        Mockito.doReturn(Mono.just(true)).when(emailService).sendForgotPasswordEmail(any(), any(), any());

        ResetUserPasswordDTO knownDto = new ResetUserPasswordDTO();
        knownDto.setEmail(knownEmail);
        knownDto.setBaseUrl(baseUrl);

        ResetUserPasswordDTO unknownDto = new ResetUserPasswordDTO();
        unknownDto.setEmail(unknownEmail);
        unknownDto.setBaseUrl(baseUrl);

        // Both existent and non-existent emails yield the identical generic success response.
        StepVerifier.create(userService.forgotPasswordTokenGenerate(knownDto))
                .expectNext(true)
                .verifyComplete();
        StepVerifier.create(userService.forgotPasswordTokenGenerate(unknownDto))
                .expectNext(true)
                .verifyComplete();

        // A reset email is sent only for the registered account; none for the unknown one.
        Mockito.verify(emailService, Mockito.times(1)).sendForgotPasswordEmail(eq(knownEmail), any(), eq(baseUrl));
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(eq(unknownEmail), any(), any());
    }

    /**
     * Full counter-sequence regression pinning the per-account reset-limit invariant end to end. Backs the
     * {@code passwordResetTokenRepository} mock with an in-memory store so the request counter actually
     * accumulates across calls (the real production behaviour):
     * <ul>
     *   <li>requests 1, 2, 3 for a known email each succeed — token saved, email sent;</li>
     *   <li>the 4th request within the 24h window is over the limit — generic success, NO email, NO new
     *       token save (and the counter is not mutated, so the block holds);</li>
     *   <li>a repeated request while still over the limit stays over the limit — same generic success, still
     *       no email / no save;</li>
     *   <li>once the 24h window has elapsed the next request is allowed again — the counter resets to 1 and
     *       an email is sent.</li>
     * </ul>
     * Every call returns the identical generic success so the rate limit is never observable to the caller
     * (CWE-204, GHSA-fvrq-g89c-fgg6).
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void forgotPasswordTokenGenerate_resetLimitCounterSequence_neverLeaksAndResetsAfterWindow() {
        String baseUrl = "https://my-instance.example.com";
        String knownEmail = "api_user";

        Mockito.doReturn(Mono.just(baseUrl)).when(secureBaseUrlResolver).resolveSecureBaseUrl(baseUrl);

        // In-memory store so the reset-token counter persists across calls, like the real repository.
        final AtomicReference<PasswordResetToken> store = new AtomicReference<>();
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenAnswer(invocation -> store.get() == null ? Mono.empty() : Mono.just(store.get()));
        Mockito.when(passwordResetTokenRepository.save(any())).thenAnswer(invocation -> {
            PasswordResetToken saved = invocation.getArgument(0);
            store.set(saved);
            return Mono.just(saved);
        });
        Mockito.doReturn(Mono.just(true)).when(emailService).sendForgotPasswordEmail(any(), any(), any());

        ResetUserPasswordDTO dto = new ResetUserPasswordDTO();
        dto.setEmail(knownEmail);
        dto.setBaseUrl(baseUrl);

        // Requests 1, 2, 3: under the limit — each succeeds, saves the token, and sends an email.
        for (int i = 1; i <= 3; i++) {
            StepVerifier.create(userService.forgotPasswordTokenGenerate(dto))
                    .expectNext(true)
                    .verifyComplete();
        }
        Mockito.verify(emailService, Mockito.times(3)).sendForgotPasswordEmail(eq(knownEmail), any(), eq(baseUrl));
        Mockito.verify(passwordResetTokenRepository, Mockito.times(3)).save(any());
        assertEquals(3, store.get().getRequestCount());

        // Request 4 within the window: over the limit — generic success, no email, no new save.
        Mockito.clearInvocations(emailService, passwordResetTokenRepository);
        StepVerifier.create(userService.forgotPasswordTokenGenerate(dto))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(any(), any(), any());
        Mockito.verify(passwordResetTokenRepository, Mockito.never()).save(any());
        assertEquals(3, store.get().getRequestCount()); // counter not mutated while over the limit

        // Request 5 (repeat while still over the limit): stays over the limit — same generic success.
        Mockito.clearInvocations(emailService, passwordResetTokenRepository);
        StepVerifier.create(userService.forgotPasswordTokenGenerate(dto))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.never()).sendForgotPasswordEmail(any(), any(), any());
        Mockito.verify(passwordResetTokenRepository, Mockito.never()).save(any());

        // Simulate the 24h window elapsing, then the next request is allowed again and the counter resets.
        store.get().setFirstRequestTime(Instant.now().minusSeconds(25 * 3600));
        Mockito.clearInvocations(emailService, passwordResetTokenRepository);
        StepVerifier.create(userService.forgotPasswordTokenGenerate(dto))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.times(1)).sendForgotPasswordEmail(eq(knownEmail), any(), eq(baseUrl));
        Mockito.verify(passwordResetTokenRepository, Mockito.times(1)).save(any());
        assertEquals(1, store.get().getRequestCount()); // counter reset for the new window
    }

    @Test
    public void verifyPasswordResetToken_WhenMalformedToken_ThrowsException() {
        String encryptedToken = "abcdef"; // malformed token
        StepVerifier.create(userService.verifyPasswordResetToken(encryptedToken))
                .verifyError(AppsmithException.class);
    }

    private String getEncodedToken(String emailAddress, String token) {
        List<NameValuePair> nameValuePairs = new ArrayList<>(2);
        nameValuePairs.add(new BasicNameValuePair("email", emailAddress));
        nameValuePairs.add(new BasicNameValuePair("token", token));
        String urlParams = WWWFormCodec.format(nameValuePairs, StandardCharsets.UTF_8);
        return EncryptionHelper.encrypt(urlParams);
    }

    @Test
    public void verifyPasswordResetToken_WhenTokenDoesNotExist_ThrowsException() {
        String testEmail = "abc@example.org";
        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.empty());

        StepVerifier.create(userService.verifyPasswordResetToken(getEncodedToken(testEmail, "123456789")))
                .expectErrorMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage())
                .verify();
    }

    private void testResetPasswordTokenMatch(String token1, String token2, boolean expectedResult) {
        String testEmail = "abc@example.org";
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setTokenHash(passwordEncoder.encode(token1));

        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.just(passwordResetToken));

        StepVerifier.create(userService.verifyPasswordResetToken(getEncodedToken(testEmail, token2)))
                .expectNext(expectedResult)
                .verifyComplete();
    }

    @Test
    public void verifyPasswordResetToken_WhenTokenDoesNotMatch_ReturnsFalse() {
        testResetPasswordTokenMatch("0123456789", "123456789", false); // different tokens
    }

    @Test
    public void verifyPasswordResetToken_WhenTokenMatches_ReturnsTrue() {
        testResetPasswordTokenMatch("0123456789", "0123456789", true); // same token
    }

    @Test
    public void resetPasswordAfterForgotPassword_WhenMalformedToken_ThrowsException() {
        String encryptedToken = "abcdef"; // malformed token
        StepVerifier.create(userService.resetPasswordAfterForgotPassword(encryptedToken, null))
                .verifyError(AppsmithException.class);
    }

    @Test
    public void resetPasswordAfterForgotPassword_WhenTokenDoesNotMatch_ThrowsException() {
        String testEmail = "abc@example.org";
        String token = getEncodedToken(testEmail, "123456789");

        // ** check if token is not present in DB ** //
        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.empty());

        StepVerifier.create(userService.resetPasswordAfterForgotPassword(token, null))
                .expectErrorMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage())
                .verify();

        // ** check if token present but hash does not match ** //
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setTokenHash(passwordEncoder.encode("abcdef"));

        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmailAndOrganizationId(any(), any()))
                .thenReturn(Mono.just(passwordResetToken));

        StepVerifier.create(userService.resetPasswordAfterForgotPassword(token, null))
                .expectErrorMessage(AppsmithError.GENERIC_BAD_REQUEST.getMessage(FieldName.TOKEN))
                .verify();
    }

    @Test
    @WithUserDetails(value = "anonymousUser")
    public void buildUserProfileDTO_WhenAnonymousUser_ReturnsProfile() {
        User user = new User();
        user.setIsAnonymous(true);
        user.setEmail("anonymousUser");
        StepVerifier.create(userService.buildUserProfileDTO(user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("anonymousUser");
                    assertThat(userProfileDTO.getIsAnonymous()).isTrue();
                })
                .verifyComplete();
    }

    /**
     * This test case asserts that on every user creation, User Management role is auto-created and associated with that user.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateNewUser_assertUserManagementRole() {
        String testName = "testCreateNewUser_assertUserManagementRole";
        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);

        User createdUser = userService.create(user).block();
        assertThat(createdUser.getPolicies()).isNotEmpty();
        assertThat(createdUser.getPolicies().stream()
                        .anyMatch(policy -> policy.getPermission().equals(MANAGE_USERS.getValue())))
                .isTrue();
        Policy manageUserPolicy = createdUser.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findFirst()
                .get();

        PermissionGroup userManagementRole = permissionGroupRepository
                .findAll()
                .filter(role ->
                        role.getName().equals(createdUser.getUsername() + FieldName.SUFFIX_USER_MANAGEMENT_ROLE))
                .blockFirst();

        assertThat(manageUserPolicy.getPermissionGroups()).hasSize(1);

        String userManagementRoleId =
                manageUserPolicy.getPermissionGroups().stream().findFirst().get();

        assertThat(userManagementRole.getId()).isEqualTo(userManagementRoleId);
    }

    private ResendEmailVerificationDTO getResendEmailVerificationDTO(String email) {
        ResendEmailVerificationDTO resendEmailVerificationDTO = new ResendEmailVerificationDTO();
        resendEmailVerificationDTO.setEmail(email);
        resendEmailVerificationDTO.setBaseUrl(DEFAULT_ORIGIN_HEADER);
        return resendEmailVerificationDTO;
    }

    /**
     * Anti-enumeration (CWE-204): when instance-level email verification is disabled, the resend endpoint
     * must return the same generic success (HTTP 200, {@code true}) as the happy path and send no email,
     * rather than surfacing a distinct EMAIL_VERIFICATION_NOT_ENABLED error that would leak the account's
     * (and the instance config's) state to an unauthenticated caller.
     *
     * <p>The gate under test is the real one — {@link InstanceVariablesHelper#isEmailVerificationEnabled()},
     * read from the instance-variables config — not {@code OrganizationConfiguration}. It is stubbed to
     * {@code false} directly so the test pins the actual code path (a fresh, unverified account that reaches
     * the gate) rather than incidentally relying on the instance default.
     */
    @Test
    @WithUserDetails("api_user")
    public void
            resendEmailVerification_WhenInstanceEmailVerificationIsNotEnabled_ReturnsGenericSuccessWithoutSendingEmail() {
        String testEmail = "test-email-for-verification";

        // A fresh, unverified account so the flow passes the already-verified check and reaches the
        // instance-level verification gate.
        Organization organization =
                organizationService.getCurrentUserOrganization().block();
        User newUser = new User();
        newUser.setEmail(testEmail);
        newUser.setEmailVerified(Boolean.FALSE);
        newUser.setOrganizationId(organization.getId());
        userRepository.save(newUser).block();

        // Pin the real gate to disabled (instance-variables config, not OrganizationConfiguration).
        Mockito.doReturn(Mono.just(false)).when(instanceVariablesHelper).isEmailVerificationEnabled();

        Mockito.clearInvocations(emailService);
        StepVerifier.create(userService.resendEmailVerification(getResendEmailVerificationDTO(testEmail), null))
                .expectNext(true)
                .verifyComplete();

        Mockito.verify(emailService, Mockito.never()).sendEmailVerificationEmail(any(), any(), any());
    }

    /**
     * Anti-enumeration (CWE-204): when the account already has a verified email, the resend endpoint must
     * return the same generic success (HTTP 200, {@code true}) and send no email, rather than a distinct
     * USER_ALREADY_VERIFIED error that would confirm the address exists and is verified.
     */
    @Test
    @WithUserDetails("api_user")
    public void resendEmailVerification_WhenUserEmailAlreadyVerified_ReturnsGenericSuccessWithoutSendingEmail() {
        String testEmail = "test-email-for-verification-user-already-verified";

        // Get current organization first
        Organization organization =
                organizationService.getCurrentUserOrganization().block();

        // create user with organization ID
        User newUser = new User();
        newUser.setEmail(testEmail);
        newUser.setEmailVerified(Boolean.TRUE);
        newUser.setOrganizationId(organization.getId());
        userRepository.save(newUser).block();

        // Setting Organization Config emailVerificationEnabled to TRUE

        OrganizationConfiguration organizationConfiguration = organization.getOrganizationConfiguration();
        organizationConfiguration.setEmailVerificationEnabled(Boolean.TRUE);
        organization.setOrganizationConfiguration(organizationConfiguration);
        organizationService.update(organization.getId(), organization).block();

        Mockito.clearInvocations(emailService);
        Mono<Boolean> emailVerificationMono =
                userService.resendEmailVerification(getResendEmailVerificationDTO(testEmail), null);

        StepVerifier.create(emailVerificationMono).expectNext(true).verifyComplete();

        Mockito.verify(emailService, Mockito.never()).sendEmailVerificationEmail(any(), any(), any());
    }

    /**
     * Anti-enumeration (CWE-204): a resend request for an address that is not registered must return the
     * same generic success (HTTP 200, {@code true}) as a known unverified account and send no email, so an
     * unauthenticated caller cannot distinguish registered from unregistered addresses.
     */
    @Test
    @WithUserDetails("api_user")
    public void resendEmailVerification_WhenEmailUnknown_ReturnsGenericSuccessWithoutSendingEmail() {
        String unknownEmail = "no-such-user-" + UUID.randomUUID() + "@example.com";

        // Ensure instance-level verification is enabled so the only reason no email is sent is the unknown
        // address (i.e. we are exercising the unknown-user branch, not the disabled-verification branch).
        Organization organization =
                organizationService.getCurrentUserOrganization().block();
        OrganizationConfiguration organizationConfiguration = organization.getOrganizationConfiguration();
        organizationConfiguration.setEmailVerificationEnabled(Boolean.TRUE);
        organization.setOrganizationConfiguration(organizationConfiguration);
        organizationService.update(organization.getId(), organization).block();

        Mockito.clearInvocations(emailService);
        Mono<Boolean> emailVerificationMono =
                userService.resendEmailVerification(getResendEmailVerificationDTO(unknownEmail), null);

        StepVerifier.create(emailVerificationMono).expectNext(true).verifyComplete();

        Mockito.verify(emailService, Mockito.never()).sendEmailVerificationEmail(any(), any(), any());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameProficiencyAndUseCaseOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("New name of user here");
        updateUser.setProficiency("Proficiency level");
        updateUser.setUseCase("New use case");
        final Mono<Tuple2<User, UserData>> resultMono = userService
                .updateCurrentUser(updateUser, null)
                .flatMap(user -> Mono.zip(Mono.just(user), userDataService.getForUserEmail("api_user")));
        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    final User user = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    assertNotNull(user);
                    assertNotNull(userData);
                    assertEquals("New name of user here", user.getName());
                    assertThat(userData.getProficiency()).isEqualTo("Proficiency level");
                    assertEquals("New use case", userData.getUseCase());
                })
                .verifyComplete();
    }

    private <I> Mono<I> runAs(Mono<I> input, User user, String password) {
        log.info("Running as user: {}", user.getEmail());
        return input.contextWrite((ctx) -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, password, user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateCurrentUser_shouldNotUpdatePolicies() {
        String testName = "testUpdateName_shouldNotUpdatePolicies";
        User user = new User();
        user.setEmail(testName + "@test.com");
        user.setPassword(testName);
        User createdUser = userService.create(user).block();
        Set<Policy> policies = createdUser.getPolicies();

        assertThat(createdUser.getName()).isNull();
        assertThat(createdUser.getPolicies()).isNotEmpty();

        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("Test Name");

        User userUpdatedPostNameUpdate = runAs(userService.updateCurrentUser(updateUser, null), createdUser, testName)
                .block();

        assertThat(userUpdatedPostNameUpdate.getName()).isEqualTo("Test Name");
        userUpdatedPostNameUpdate.getPolicies().forEach(policy -> {
            assertThat(policies).contains(policy);
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateWithoutPermission_shouldUpdateChangedFields() {
        String testName = "testUpdateWithoutPermission_shouldUpdateChangedFields";
        User user = new User();
        user.setEmail(testName + "@test.com");
        user.setPassword(testName);
        User createdUser = userService.create(user).block();
        Set<Policy> policies = createdUser.getPolicies();

        User update = new User();
        update.setName("Test Name");
        update.setState(UserState.ACTIVATED);
        User updatedUser =
                userService.updateWithoutPermission(createdUser.getId(), update).block();

        assertThat(updatedUser.getName()).isEqualTo("Test Name");
        assertThat(updatedUser.getState()).isEqualTo(UserState.ACTIVATED);
        policies.forEach(policy -> {
            assertThat(updatedUser.getPolicies()).contains(policy);
        });
    }
}
