package com.appsmith.server.services;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
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

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.constants.AccessControlConstants.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;
import static com.appsmith.server.constants.Appsmith.DEFAULT_ORIGIN_HEADER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Autowired
    TenantService tenantService;

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
                    assertThat(user.getTenantId()).isNotNull();

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

        Mono<User> usercreateMono = userService.create(newUser).cache();

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
                    assertEquals(newUser.getEmail(), user.getEmail());
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
                    assertEquals(newUser.getEmail(), user.getEmail());
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
    public void updateRoleOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setRole("New role of user");
        final Mono<UserData> resultMono =
                userService.updateCurrentUser(updateUser, null).then(userDataService.getForUserEmail("api_user"));
        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.getRole()).isEqualTo("New role of user");
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
                    assertThat(userData.isIntercomConsentGiven()).isFalse();
                })
                .verifyComplete();

        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setIntercomConsentGiven(true);
        final Mono<UserData> updateToTrueMono =
                userService.updateCurrentUser(updateUser, null).then(userDataMono);
        StepVerifier.create(updateToTrueMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.isIntercomConsentGiven()).isTrue();
                })
                .verifyComplete();

        updateUser.setIntercomConsentGiven(false);
        final Mono<UserData> updateToFalseAfterTrueMono =
                userService.updateCurrentUser(updateUser, null).then(userDataMono);
        StepVerifier.create(updateToFalseAfterTrueMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.isIntercomConsentGiven()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getIntercomConsentOfUserOnCloudHosting_AlwaysTrue() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);

        Mono<UserProfileDTO> userProfileDTOMono =
                sessionUserService.getCurrentUser().flatMap(userService::buildUserProfileDTO);

        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO -> {
                    assertNotNull(userProfileDTO);
                    assertThat(userProfileDTO.isIntercomConsentGiven()).isTrue();
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
    public void updateNameRoleAndUseCaseOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("New name of user here");
        updateUser.setRole("New role of user");
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
                    assertEquals("New role of user", userData.getRole());
                    assertEquals("New use case", userData.getUseCase());
                })
                .verifyComplete();
    }

    @Test
    public void forgotPasswordTokenGenerate_AfterTrying3TimesIn24Hours_ThrowsException() {
        String testEmail = "test-email-for-password-reset";
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setRequestCount(3);
        passwordResetToken.setFirstRequestTime(Instant.now());

        // mock the passwordResetTokenRepository to return request count 3 in 24 hours
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.just(passwordResetToken));

        ResetUserPasswordDTO resetUserPasswordDTO = new ResetUserPasswordDTO();
        resetUserPasswordDTO.setEmail("test-email-for-password-reset");

        StepVerifier.create(userService.forgotPasswordTokenGenerate(resetUserPasswordDTO))
                .expectError(AppsmithException.class)
                .verify();
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
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.empty());

        StepVerifier.create(userService.verifyPasswordResetToken(getEncodedToken(testEmail, "123456789")))
                .expectErrorMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage())
                .verify();
    }

    private void testResetPasswordTokenMatch(String token1, String token2, boolean expectedResult) {
        String testEmail = "abc@example.org";
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setTokenHash(passwordEncoder.encode(token1));

        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.just(passwordResetToken));

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
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.empty());

        StepVerifier.create(userService.resetPasswordAfterForgotPassword(token, null))
                .expectErrorMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage())
                .verify();

        // ** check if token present but hash does not match ** //
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setTokenHash(passwordEncoder.encode("abcdef"));

        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.just(passwordResetToken));

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
                    assertThat(userProfileDTO.isAnonymous()).isTrue();
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

    @Test
    public void emailVerificationTokenGenerate_WhenInstanceEmailVerificationIsNotEnabled_ThrowsException() {
        String testEmail = "test-email-for-verification";

        // create user
        User newUser = new User();
        newUser.setEmail(testEmail);
        Mono<User> userMono = userRepository.save(newUser);

        // Setting tenant Config emailVerificationEnabled to FALSE
        Mono<Tenant> tenantMono = tenantService.getDefaultTenant().flatMap(tenant1 -> {
            TenantConfiguration tenantConfiguration = tenant1.getTenantConfiguration();
            tenantConfiguration.setEmailVerificationEnabled(Boolean.FALSE);
            tenant1.setTenantConfiguration(tenantConfiguration);
            return tenantService.update(tenant1.getId(), tenant1);
        });

        Mono<Boolean> emailVerificationMono =
                userService.resendEmailVerification(getResendEmailVerificationDTO(testEmail), null);

        Mono<Boolean> resultMono = userMono.then(tenantMono).then(emailVerificationMono);

        StepVerifier.create(resultMono)
                .expectErrorMessage(AppsmithError.TENANT_EMAIL_VERIFICATION_NOT_ENABLED.getMessage())
                .verify();
    }

    @Test
    public void emailVerificationTokenGenerate_WhenUserEmailAlreadyVerified_ThrowsException() {
        String testEmail = "test-email-for-verification-user-already-verified";

        // create user
        User newUser = new User();
        newUser.setEmail(testEmail);
        newUser.setEmailVerified(Boolean.TRUE);
        Mono<User> userMono = userRepository.save(newUser);

        // Setting tenant Config emailVerificationEnabled to TRUE
        Mono<Tenant> tenantMono = tenantService.getDefaultTenant().flatMap(tenant1 -> {
            TenantConfiguration tenantConfiguration = tenant1.getTenantConfiguration();
            tenantConfiguration.setEmailVerificationEnabled(Boolean.TRUE);
            tenant1.setTenantConfiguration(tenantConfiguration);
            return tenantService.update(tenant1.getId(), tenant1);
        });

        Mono<Boolean> emailVerificationMono =
                userService.resendEmailVerification(getResendEmailVerificationDTO(testEmail), null);

        Mono<Boolean> resultMono = userMono.then(tenantMono).then(emailVerificationMono);

        StepVerifier.create(resultMono)
                .expectErrorMessage(AppsmithError.USER_ALREADY_VERIFIED.getMessage())
                .verify();
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
